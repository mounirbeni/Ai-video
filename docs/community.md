# Official Nexora community

`/community` is a members-only announcement feed. Any signed-in member can read published posts; visitors sign in first. Only two publishing identities can create, publish, unpublish, pin, edit or delete posts:

- The existing ADMIN account whose email matches the server's `ADMIN_EMAIL` setting.
- The verified site developer designated by `getAccountIdentity`.

The production `ADMIN_EMAIL` setting was confirmed present without retrieving its value. Additional admins receive no publishing permission. Legacy installations without this setting accept a single existing admin only; if multiple admins exist, owner publishing fails closed until `ADMIN_EMAIL` identifies the owner. The developer gets community publishing access only, with no additional site administration or subscription rights.

## Flow

Community links appear in the header, footer, home shortcuts, mobile navigation, account and admin navigation. The owner's recent removal of mobile Search is preserved; Community occupies the additional mobile tab.

Publishers can write at `/community/new`, save private drafts, publish to members, choose Announcements / Site updates / Behind the scenes, pin published posts, and manage all posts including one another's drafts. Editing preserves the original author. Author names, current avatars and identity badges appear on the feed and post pages, without exposing author email addresses. The UI supports Arabic/RTL and English.

Drafts are excluded from member queries, direct post URLs and pagination. Management URLs and forged form fields grant no extra access. A plain-text title (3–140 characters) and body (20–12,000 characters) are validated on the server and rendered as escaped text. Publishing is an explicit checkbox, off by default. Pinning is restricted to published posts. Lists are paginated in groups of 20, ordered by pin, creation time and ID. Category filters preserve the current view when paging.

Edit/delete operations require the current version to avoid overwriting simultaneous changes. Deletion has a separate confirmation step. All mutations authenticate against the current user record and apply a persistent per-publisher write limit. The feed and individual posts are revalidated after changes. Community pages are dynamic and excluded from indexing. No starter posts or production test users are created.

## Database and deployment

`CommunityPost` belongs to its original author; deleting that user is restricted while posts exist. The additive `20261025-community.sql` update creates the table and feed index transactionally and repeatably. Production preparation and `npm run db:upgrade` apply it after the earlier reviewed updates. There is no database reset, role change or content seed. Local/preview builds skip database updates and require an upgraded test/preview database.

The current master changes to `scripts/upload-media.mjs` in the build command and removal of the mobile Search tab are preserved.

## Verification

47 tests passed against isolated Postgres. They cover the exact two publishing seats, rejection of extra admins and spoofed roles/emails/authors, developer verification removal, draft secrecy, publication/unpublication, category filters, deterministic pagination, pinning, author preservation, edit conflicts, confirmed/versioned deletion, validation and rate limits. Component tests check private-by-default editing and the Arabic deletion confirmation. Repeated production preparation preserves an existing draft. Type checking, lint (0 errors, existing warnings) and production build are checked before merge.

Local HTTP verification checks the real sign-in/member/publisher pages, native create/edit forms, private draft URLs, author avatar/badge rendering, Arabic/RTL and escaping. No connected browser was available for a visual viewport review.
