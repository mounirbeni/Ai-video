# Profile avatars

Signed-in viewers can open Account → Change avatar, choose one of ten characters, preview it, and save. The selection appears on the account profile, desktop account link and mobile Account tab. The picker and messages support English and Arabic. Initials remain the default for existing accounts and can be restored from the picker.

The ten stable IDs are orbit (astronaut), nova (robot), ember (fox), luna (cat), storm (wolf), jade (dragon), echo (owl), pixel (gamer), sol (lion), and vela (alien). They share an original AI-generated five-column/two-row atlas exported as a 339 KB WebP. CSS positions display each square without changing the original character artwork. The browser can reuse the same asset for the picker and navigation; no external image service or per-request image generation is required.

Only these IDs or the initials reset are accepted by the server action. It authenticates the session and updates that account alone; external URLs and other users' IDs are not accepted as avatar sources or update targets. `User.avatarId` is nullable, so missing/unknown choices fall back to initials.

The additive update `prisma/updates/20261025-profile-avatars.sql` adds the nullable field without changing current profiles. Vercel production preparation applies the explicit security/library and avatar updates, each transactionally and repeatably. Preview builds continue to skip database changes and need an upgraded preview database for authenticated testing. Outside Vercel, run `npm run db:upgrade` before publishing.

Validation: 29 tests passed, including all ten choices, account ownership, invalid identifiers, initials restoration, picker preview/localization and migration repeatability. Type checking, lint (existing warnings) and production build passed. Local HTTP testing submitted the real progressive form, verified persistence after reload and avatar rendering in account/navigation, rejected an arbitrary URL, restored initials, checked Arabic/RTL and fetched the generated WebP. Browser visual review was unavailable; the generated artwork itself was visually inspected.
