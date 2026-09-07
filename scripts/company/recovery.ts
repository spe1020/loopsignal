/** Operator-only backup/restore. Never exposed as a web endpoint. */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { hash } from "../../lib/hosted/service";
import { type ObjectStore, privateObjects } from "../../lib/hosted/files";
const run = promisify(execFile);
function connection(url: string) {
  const u = new URL(url);
  return {
    args: [
      "-h",
      u.hostname,
      "-p",
      u.port || "5432",
      "-U",
      decodeURIComponent(u.username),
      "-d",
      u.pathname.slice(1),
    ],
    env: {
      ...process.env,
      PGPASSWORD: decodeURIComponent(u.password),
      PGSSLMODE: ["127.0.0.1", "localhost"].includes(u.hostname)
        ? "disable"
        : "verify-full",
    },
  };
}
export async function backup(
  databaseUrl: string,
  directory: string,
  objects: ObjectStore,
) {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const sql = postgres(databaseUrl, { max: 1 });
  try {
    // Pause command writers during an operator backup. Database rows and object
    // inventory are captured while this session owns the SHARE table locks.
    return await sql.begin(async (tx) => {
      await tx`lock table company.investigations,company.attachments,company.deletion_ledger in share mode`;
      const files =
        await tx`select a.* from company.attachments a join company.investigations i on i.org_id=a.org_id and i.id=a.investigation_id where a.state='ready' and i.deleted_at is null order by a.id`;
      const manifest = [];
      for (const file of files) {
        const bytes = await objects.get(file.object_key);
        if (hash(bytes) !== file.checksum)
          throw new Error("Backup stopped: source checksum mismatch");
        await writeFile(path.join(directory, `${file.id}.bin`), bytes, {
          mode: 0o600,
        });
        manifest.push({
          id: file.id,
          key: file.object_key,
          checksum: file.checksum,
          size: bytes.length,
        });
      }
      const c = connection(databaseUrl);
      await run(
        "pg_dump",
        [
          ...c.args,
          "--format=custom",
          "--no-owner",
          "--file",
          path.join(directory, "database.dump"),
        ],
        { env: c.env },
      );
      const result = {
        format: "loopsignal-backup",
        version: 1,
        completedAt: new Date().toISOString(),
        files: manifest,
      };
      await writeFile(
        path.join(directory, "manifest.json"),
        JSON.stringify(result, null, 2),
        { mode: 0o600 },
      );
      return result;
    });
  } finally {
    await sql.end();
  }
}
export async function restore(
  databaseUrl: string,
  directory: string,
  objects: ObjectStore,
  latestDeletions: { org_id: string; record_id: string }[],
) {
  const u = new URL(databaseUrl);
  if (!["127.0.0.1", "localhost"].includes(u.hostname))
    throw new Error(
      "Automated restore is restricted to an isolated local target. Hosted restore requires the operator runbook.",
    );
  const sql = postgres(databaseUrl, { max: 1 });
  try {
    const [existing] =
      await sql`select to_regclass('company.investigations') as present`;
    if (existing.present) throw new Error("Restore target must be empty");
    const c = connection(databaseUrl);
    await run(
      "pg_restore",
      [
        ...c.args,
        "--no-owner",
        "--exit-on-error",
        path.join(directory, "database.dump"),
      ],
      { env: c.env },
    );
    const manifest = JSON.parse(
      await readFile(path.join(directory, "manifest.json"), "utf8"),
    ) as {
      files: { id: string; key: string; checksum: string; size: number }[];
    };
    // Reapply the current deletion ledger BEFORE opening network access or exposing
    // objects. Backup-time tombstones alone cannot honor subsequent deletion.
    for (const d of latestDeletions) {
      await sql`update company.investigations set deleted_at=coalesce(deleted_at,clock_timestamp()) where org_id=${d.org_id} and id=${d.record_id}`;
      await sql`update company.attachments set state='deleted' where org_id=${d.org_id} and investigation_id=${d.record_id}`;
      await sql`insert into company.deletion_ledger(org_id,record_id) values(${d.org_id},${d.record_id}) on conflict do nothing`;
    }
    let restored = 0;
    for (const file of manifest.files) {
      const [row] =
        await sql`select media_type,state,checksum from company.attachments where id=${file.id}`;
      if (row?.state !== "ready") continue;
      const bytes = await readFile(path.join(directory, `${file.id}.bin`));
      if (hash(bytes) !== file.checksum || row.checksum !== file.checksum)
        throw new Error("Restore checksum mismatch");
      await objects.put(file.key, bytes, row.media_type);
      if (hash(await objects.get(file.key)) !== file.checksum)
        throw new Error("Restored object checksum failed");
      restored++;
    }
    // Validate every FK, even relationships unrelated to the chosen fixture.
    const violations =
      await sql`select e.source_id from company.edges e left join company.nodes n on n.org_id=e.org_id and n.investigation_id=e.investigation_id and n.id=e.target_id where n.id is null`;
    if (violations.length) throw new Error("Relationship verification failed");
    return { filesRestored: restored, completedAt: new Date().toISOString() };
  } finally {
    await sql.end();
  }
}
if (process.argv[1]?.endsWith("/recovery.ts")) {
  const [mode, directory] = process.argv.slice(2),
    url = process.env.COMPANY_BACKUP_DATABASE_URL;
  if (!url || !directory)
    throw new Error(
      "Set COMPANY_BACKUP_DATABASE_URL and supply backup directory",
    );
  if (mode !== "backup")
    throw new Error(
      "Use the isolated restore exercise or the reviewed operator runbook for restoration",
    );
  backup(url, directory, privateObjects()).then((r) =>
    process.stdout.write(
      JSON.stringify({ files: r.files.length, completedAt: r.completedAt }) +
        "\n",
    ),
  );
}
