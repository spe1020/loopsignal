import { z } from "zod";
import { siteUrl } from "@/lib/site";
import { authenticated, authClient } from "@/lib/hosted/auth";
import {
  changeMember,
  companyState,
  createCompany,
  execute,
  getRecord,
} from "@/lib/hosted/service";
import { acceptInvite, invite, revokeInvite } from "@/lib/hosted/invitations";
import {
  downloadFile,
  exportRecord,
  finalizeUpload,
  stageUpload,
} from "@/lib/hosted/files";
import { confirmImport } from "@/lib/hosted/imports";
import { runOutbox } from "@/lib/hosted/outbox";
import {
  CompanyError,
  ensure,
  Roles,
  textField,
  uuid,
} from "@/lib/hosted/types";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers });
async function body(req: Request, limit = 2 * 1024 * 1024) {
  const reader = req.body?.getReader();
  ensure(reader, "Request body is required");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) {
      await reader.cancel();
      throw new CompanyError(413, "Request too large");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
const context = { organizationId: uuid, commandId: uuid };
const fileContext = {
  organizationId: uuid,
  recordId: uuid,
  attachmentId: uuid,
  expectedRevision: z.coerce.number().int().min(1),
  commandId: uuid,
};
async function handle(req: Request, path: string[]) {
  const url = new URL(req.url),
    route = path.join("/");
  if (req.method !== "GET")
    ensure(
      req.headers.get("origin") === new URL(siteUrl).origin,
      "Request origin is not permitted",
      403,
    );
  if (req.method === "GET" && route === "auth/callback") {
    const code = url.searchParams.get("code");
    ensure(code, "Sign-in code missing");
    const auth = await authClient();
    const { error } = await auth.auth.exchangeCodeForSession(code);
    ensure(!error, "Sign-in link expired or already used", 401);
    return Response.redirect(new URL("/company", siteUrl));
  }
  if (req.method === "POST" && route.startsWith("auth/")) {
    const data = JSON.parse((await body(req, 16384)).toString()),
      auth = await authClient();
    if (route === "auth/sign-in" || route === "auth/sign-up") {
      const fields = z
        .object({
          email: z.email().max(254),
          password: z.string().min(12).max(128),
        })
        .strict()
        .parse(data);
      if (route === "auth/sign-up")
        ensure(
          /@[^@]+\.test$/i.test(fields.email),
          "Use a synthetic address ending in .test for this evaluation",
        );
      const result =
        route === "auth/sign-in"
          ? await auth.auth.signInWithPassword(fields)
          : await auth.auth.signUp({
              ...fields,
              options: {
                emailRedirectTo: new URL("/api/company/auth/callback", siteUrl)
                  .href,
              },
            });
      ensure(
        !result.error,
        "Sign-in failed or email confirmation is required",
        401,
      );
      const factors = await auth.auth.mfa.listFactors();
      return json({
        ok: true,
        confirmationRequired: !result.data.session,
        factors: factors.data?.totp ?? [],
      });
    }
    if (route === "auth/sign-out") {
      await auth.auth.signOut();
      return json({ ok: true });
    }
    const { data: user, error } = await auth.auth.getUser();
    ensure(!error && user.user, "Sign in first", 401);
    if (route === "auth/mfa-enroll") {
      const result = await auth.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "LoopSignal authenticator",
      });
      ensure(!result.error, "Authenticator setup failed");
      return json(result.data);
    }
    if (route === "auth/mfa-verify") {
      const v = z
        .object({ factorId: uuid, code: z.string().regex(/^\d{6}$/) })
        .strict()
        .parse(data);
      const result = await auth.auth.mfa.challengeAndVerify(v);
      ensure(!result.error, "Authenticator code was not accepted", 401);
      return json({ ok: true });
    }
    throw new CompanyError(404, "Unknown authentication action");
  }
  const actor = await authenticated();
  if (req.method === "GET") {
    if (route === "state")
      return json(
        await companyState(
          actor,
          url.searchParams.has("organizationId")
            ? uuid.parse(url.searchParams.get("organizationId"))
            : undefined,
          (url.searchParams.get("q") ?? "").slice(0, 200),
        ),
      );
    const org = uuid.parse(url.searchParams.get("organizationId")),
      id = uuid.parse(url.searchParams.get("recordId"));
    if (route === "record") return json(await getRecord(actor, org, id));
    if (route === "export") return json(await exportRecord(actor, org, id));
    if (route === "file") {
      const { file, bytes } = await downloadFile(
        actor,
        org,
        id,
        uuid.parse(url.searchParams.get("attachmentId")),
      );
      return new Response(new Uint8Array(bytes), {
        headers: {
          ...headers,
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
          "Content-Security-Policy": "sandbox; default-src 'none'",
        },
      });
    }
  } else if (req.method === "POST") {
    if (route === "upload/finalize")
      return json(
        await finalizeUpload(
          actor,
          z
            .object(fileContext)
            .strict()
            .parse(Object.fromEntries(url.searchParams)),
          await body(req, 10485760),
        ),
      );
    const input = JSON.parse((await body(req)).toString());
    if (route === "organizations")
      return json(
        await createCompany(
          actor,
          z
            .object({
              name: textField.min(1).max(120),
              site: textField.min(1).max(120),
              team: textField.min(1).max(120),
              commandId: uuid,
            })
            .strict()
            .parse(input),
        ),
      );
    if (route === "commands") return json(await execute(actor, input));
    if (route === "invitations")
      return json(
        await invite(
          actor,
          z
            .object({
              ...context,
              email: z.email().max(254),
              role: Roles.exclude(["owner"]),
              reviewer: z.boolean(),
            })
            .strict()
            .parse(input),
        ),
      );
    if (route === "invitations/revoke") {
      const v = z
        .object({ organizationId: uuid, id: uuid })
        .strict()
        .parse(input);
      return json(await revokeInvite(actor, v.organizationId, v.id));
    }
    if (route === "invitations/accept") {
      const v = z
        .object({ token: z.string().min(40).max(100) })
        .strict()
        .parse(input);
      return json(await acceptInvite(actor, v.token));
    }
    if (route === "members")
      return json(
        await changeMember(
          actor,
          z
            .object({
              ...context,
              userId: uuid,
              role: Roles,
              reviewer: z.boolean(),
              revoke: z.boolean(),
            })
            .strict()
            .parse(input),
        ),
      );
    if (route === "upload/stage")
      return json(
        await stageUpload(
          actor,
          z
            .object({
              ...context,
              recordId: uuid,
              evidenceId: uuid,
              expectedRevision: z.number().int().min(1),
              filename: textField.min(1).max(160),
              size: z.number().int().min(1).max(10485760),
              mediaType: z.enum([
                "application/pdf",
                "image/png",
                "image/jpeg",
                "text/plain",
                "text/csv",
              ]),
            })
            .strict()
            .parse(input),
        ),
      );
    if (route === "import")
      return json(
        await confirmImport(
          actor,
          z
            .object({
              ...context,
              checksum: z.string().length(64),
              mapping: z.record(z.string(), uuid.nullable()),
              document: z.unknown(),
              confirmed: z.literal(true),
            })
            .strict()
            .parse(input),
        ),
      );
    if (route === "jobs") {
      const v = z.object({ organizationId: uuid }).strict().parse(input);
      return json(await runOutbox(actor, v.organizationId));
    }
  }
  throw new CompanyError(404, "Company operation not found");
}
async function route(
  req: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  try {
    return await handle(req, (await ctx.params).path);
  } catch (error) {
    if (error instanceof CompanyError)
      return json(
        { error: error.message, details: error.details },
        error.status,
      );
    if (error instanceof z.ZodError)
      return json(
        {
          error:
            "Invalid command. Protected fields and unknown references are not accepted.",
          issues: error.issues.map((i) => ({
            path: i.path,
            message: i.message,
          })),
        },
        400,
      );
    if (error instanceof SyntaxError)
      return json({ error: "Request must contain valid JSON" }, 400);
    // No evidence, SQL arguments, tokens, or credentials in telemetry/errors.
    return json(
      {
        error:
          "Company operation unavailable. Your unsaved draft remains in this editor; retry or export recovery.",
      },
      503,
    );
  }
}
export { route as GET, route as POST };
