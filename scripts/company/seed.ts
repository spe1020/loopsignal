import { createClient } from "@supabase/supabase-js";
const url = process.env.SUPABASE_URL,
  key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key || !["127.0.0.1", "localhost"].includes(new URL(url).hostname))
  throw new Error(
    "Synthetic seed requires local Supabase URL and local service key",
  );
const client = createClient(url, key, { auth: { persistSession: false } });
const password = "Synthetic-local-only-2026!";
for (const email of [
  "owner@factory.test",
  "colleague@factory.test",
  "participant@factory.test",
  "viewer@factory.test",
  "other-owner@factory.test",
]) {
  const { error } = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error && !error.message.includes("already")) throw error;
  process.stdout.write(`Synthetic account ready: ${email}\n`);
}
process.stdout.write(
  "Use the documented synthetic password. No real invitations were sent. Create the company in /company.\n",
);
