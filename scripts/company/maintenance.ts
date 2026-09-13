import postgres from "postgres";
import { privateObjects } from "../../lib/hosted/files";
// Dedicated operator credentials, never imported by application routes. Preview
// reports only. --apply requires an explicitly selected LOCAL database in v1.
const url = process.env.COMPANY_MAINTENANCE_DATABASE_URL;
if (!url) throw new Error("Set COMPANY_MAINTENANCE_DATABASE_URL");
const apply = process.argv.includes("--apply");
if (
  apply &&
  (!["127.0.0.1", "localhost"].includes(new URL(url).hostname) ||
    !process.env.SUPABASE_URL ||
    !["127.0.0.1", "localhost"].includes(
      new URL(process.env.SUPABASE_URL).hostname,
    ))
)
  throw new Error(
    "Hosted maintenance requires the reviewed operator runbook; automatic apply is local-only",
  );
const sql = postgres(url, { max: 1 });
try {
  const abandoned =
    await sql`select * from company.attachments where state='staged' and created_at<now()-interval '24 hours'`;
  const deleted =
    await sql`select * from company.investigations where deleted_at<now()-interval '30 days'`;
  process.stdout.write(
    JSON.stringify({
      abandonedUploads: abandoned.length,
      recordsDueForPurge: deleted.length,
      apply,
    }) + "\n",
  );
  if (apply) {
    const objects = privateObjects();
    // Deleting bytes is idempotent. Marking a staged object missing prevents it from
    // being mistaken for a finalized source. Existing reviewed bytes are untouched.
    for (const f of abandoned) {
      await objects.remove(f.object_key);
      await sql`update company.attachments set state='missing' where org_id=${f.org_id} and id=${f.id} and state='staged'`;
    }
    for (const r of deleted) {
      await sql.begin(async (tx) => {
        await tx`select pg_advisory_xact_lock(hashtextextended(${r.org_id},1))`;
        const files =
          await tx`select * from company.attachments where org_id=${r.org_id} and investigation_id=${r.id}`;
        for (const f of files) await objects.remove(f.object_key);
        await tx`update company.attachments set state='deleted',filename='[deleted]' where org_id=${r.org_id} and investigation_id=${r.id}`;
        await tx`update company.investigations set document=${JSON.stringify({ version: 1, investigation: { id: r.id }, purged: true })}::text::jsonb where org_id=${r.org_id} and id=${r.id}`;
      });
    }
  }
} finally {
  await sql.end();
}
