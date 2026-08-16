<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# LoopSignal

This is the LoopSignal marketing site.

- **Brand:** LoopSignal. Use this name in copy, metadata, and generated files.
- **Live site:** https://www.loopsignal.co (apex 308s to www)
- **Canonical URL:** `NEXT_PUBLIC_SITE_URL` is the only definition. Fallback in `lib/site.ts` is `https://www.loopsignal.co`. Do not invent another domain.
- **Products:** LoopScan (assessment), LoopBuild (implementation); LoopSupply, LoopKnow, LoopSource, LoopBrief (demos)
- **GitHub:** spe1020/loopsignal
- **Vercel project:** loopsignal
