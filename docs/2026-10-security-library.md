# Account security, payments and viewer library update

## Rollout

This branch upgrades Next.js 14 to 16.4.3 and React 18 to 19.3.1, including async request APIs and form hooks. Use Node.js 24 on Vercel (Node >=22.12 locally).

Before deploying this code:

1. Take a database backup using your existing database administration tools.
2. Set `AUTH_SECRET` to a unique randomly generated secret of at least 32 characters and `APP_URL` to your HTTPS production origin. Keep the existing secret if it already meets these requirements. The production runtime refuses missing or short secrets.
3. Apply the **additive, one-time** SQL update to the existing database from this branch:

   ```sh
   npm ci
   npm run db:upgrade
   ```

   This adds session versions, watchlists, persistent attempt counters, completion flags and subtitle/HLS settings. It does not remove existing content, payments or users. The repository previously used `db push` and has no migration baseline; do not run `migrate reset` against an existing database. For a brand-new database, use `npm run db:push` instead.
4. Build and deploy the branch after the database update. All previously issued login sessions are invalidated once; users sign in again. Future password changes and resets invalidate other sessions, keeping the device completing the change signed in.
5. Test a sandbox payment with the configured provider and verify playback from the actual storage provider before promoting the deployment.

No production database or provider credentials were available in the implementation workspace. The production database and deployed site were not changed.

Production builds explicitly use Webpack because the existing favicon’s embedded PNG format is rejected by Turbopack. The existing icon is preserved.

## Features

- **My list:** save published titles from their details page; remove from the list. Available in desktop navigation and from Account on mobile. Lists are private to each account.
- **Continue watching:** home row resumes movies and specific episodes. Completed items and unpublished/coming-soon titles are hidden. Series show the most recently watched unfinished episode.
- **Player:** bounded automatic retries, visible network/access/device-limit errors, manual retry and subscription-account link.
- **Subtitles:** administrators enter WebVTT tracks in the title/episode form, one per line: `ar | العربية | https://cdn.example.com/ar.vtt`. Subtitle URLs must use HTTPS and end in `.vtt`. Hosting must send correct CORS headers for the site origin (including video responses when cross-origin subtitle loading requires it).
- **Adaptive quality:** choose HLS in the admin form and supply an existing HLS master manifest URL. Safari uses native HLS; other supported browsers load hls.js on demand, with Auto and available rendition choices. This does not transcode existing MP4 uploads or generate subtitle files. The manifest, variants and segments need correct CORS and access control on the media host; signing only a manifest does not protect public segments. Keep private MP4 storage as-is until an HLS delivery pipeline is configured.

## Security and payment behavior

- Attempt limits persist across server instances: login (10/account/15 min), register (5/account/hour), reset email (3/account/hour), verification mail (3/account/hour), password changes and reset token submission (10/account or token/15 min). Address buckets allow 10 times the corresponding limit. On Vercel, the trusted ingress address header is used. Other hosts must overwrite `x-forwarded-for` at their trusted proxy. Expired counters can be removed periodically with `DELETE FROM "RateLimit" WHERE "expiresAt" < NOW();`.
- Password changes and resets increment `sessionVersion` and invalidate pending reset tokens. Reset-token consumption and password update are transactional.
- PayPal capture recording and access grants, activation-code consumption and grants, and manual payment approval and grants commit together. Duplicate confirmations cannot extend access twice. Database failures roll back the operation so it can be retried.
- Serializable transactions retry conflicts. Access extensions and stream reservations lock the account row to prevent competing updates.
- Dependency overrides patch Zod within @vercel/cli-config (same major) and selector parsing used by Tailwind/PostCSS. These retain the existing Tailwind 3 styling; run the build when updating them. `npm audit` reported zero advisories at implementation time.

## Verification

```sh
npm ci
npx prisma generate
npm run typecheck
npm run lint
npm test
npm audit
npm run build
```

Unit tests always run. Database integration tests run only when `TEST_DATABASE_URL` points to an **isolated database named `nexora_test`**. They create/delete test fixtures and install a temporary failure-injection trigger. Never point them at a real site database.

```sh
# Create the isolated test database first, then:
DATABASE_URL="$TEST_DATABASE_URL" npm run db:push
npm run test:integration
```

The database update was tested by creating the original schema in a fresh Postgres 16 database, applying the SQL, and testing the upgraded code. Integration tests cover session revocation, password-reset reuse, concurrent attempt limits, duplicate captures, payment rollback/retry, activation codes, manual approvals, watchlist ownership and progress validation. PayPal and email transport are mocked; the database, transactions, token signing and password hashing are real. Tests do not charge cards or send email.

Implementation validation: 14 tests passed against the isolated Postgres database, type checking passed, production Webpack build passed, and lint passed with existing warnings (fonts/navigation and redundant image-rule suppressions). HTTP smoke checks passed for public pages in English/Arabic, authenticated My list/title/watch pages, resume/completion visibility, stream HEAD authorization and revoked-session redirects. Browser visual review and real provider/media delivery remain unverified.
