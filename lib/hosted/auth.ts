import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ensure, type Actor } from "./types";
export async function authClient() {
  const url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_PUBLISHABLE_KEY;
  ensure(
    url && key,
    "Company sign-in is unavailable until the private development environment is configured.",
    503,
  );
  const parsed = new URL(url);
  ensure(
    parsed.protocol === "https:" ||
      ["localhost", "127.0.0.1"].includes(parsed.hostname),
    "Hosted authentication requires HTTPS",
    503,
  );
  const jar = await cookies();
  return createServerClient(url, key, {
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: parsed.protocol === "https:",
      path: "/",
    },
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (items) => {
        for (const { name, value, options } of items)
          jar.set(name, value, {
            ...options,
            httpOnly: true,
            sameSite: "lax",
            secure: parsed.protocol === "https:",
          });
      },
    },
  });
}
export async function authenticated(): Promise<Actor> {
  const supabase = await authClient();
  const { data, error } = await supabase.auth.getUser();
  ensure(
    !error && data.user?.email && data.user.email_confirmed_at,
    "Sign in with a confirmed account to continue",
    401,
  );
  // MFA-enrolled accounts must complete their factor on this session.
  const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  ensure(!assurance.error, "Authentication is unavailable", 503);
  ensure(
    assurance.data?.nextLevel !== "aal2" ||
      assurance.data.currentLevel === "aal2",
    "Complete your authenticator verification to continue",
    401,
  );
  return { id: data.user.id, email: data.user.email };
}
