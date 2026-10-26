# Original movie proposals

The owner approved original film concepts and poster thumbnails, shown as “Coming soon” without announced release dates. The Movies page previously returned no results because all 32 existing titles were series. This update adds six distinct MOVIE entries; it changes no existing title or episode.

| Slug | English | العربية | Direction |
|---|---|---|---|
| neon-harbor | Neon Harbor | ميناء النيون | Futuristic Casablanca thriller |
| atlas-at-dawn | Atlas at Dawn | فجر الأطلس | Mountain adventure / drama |
| the-last-lantern | The Last Lantern | الفانوس الأخير | Fez mystery / fantasy |
| letters-to-the-sea | Letters to the Sea | رسائل إلى البحر | Essaouira romance / drama |
| midnight-delivery | Midnight Delivery | توصيل منتصف الليل | Marrakesh comedy / adventure |
| the-glass-observatory | The Glass Observatory | المرصد الزجاجي | Desert cosmic science fiction |

Every synopsis explicitly identifies the title as a proposed original film concept. The English/Arabic card labels say “Coming soon · Proposed film” / “قريبًا · فيلم مقترح”. No video, trailer, duration, year, language, cast or release date is invented. All entries are published for discovery, comingSoon=true, featured=false and isFree=false. The existing card/detail/watch logic displays the preview state and hides watch buttons from the title page. Members can add previews to My List using the normal flow.

## Publishing

`prisma/catalog/20261026-movie-concepts.json` records the approved creative metadata. The reviewed `20261026-movie-concepts.sql` is the production publishing artifact. It inserts the six rows and a Setting marker in one transaction, guarded by an advisory lock and timeouts. Conflicting IDs/slugs are left untouched, including existing series. After the marker is written, subsequent builds do not reinsert deleted movies, republish hidden entries or overwrite admin edits. The marker is `catalog:20261026:movie-concepts`; retain it after publication.

Production preparation applies this explicit catalog addition after the existing schema updates. This is an intentional owner-requested content addition, not a generic database seed. Preview and local builds continue to skip database writes. Manual environments can use `npm run db:upgrade` once to apply it. Existing account, community, media-upload and playback features are preserved.

## Artwork provenance

The six original fictional poster artworks were generated with the built-in native ImageGen route, following Creative Production's batch-generation delegation instructions. Three image workers generated two clean standalone posters each. No celebrities, existing franchise imagery, release claims, actor credits or third-party logos were requested. All six exact English titles were visually checked. The Creative Production board tool was unavailable, so generation used native ImageGen directly.

Original 1024×1536 PNGs are preserved in `/workspace/generated_images`:

- Neon Harbor: `exec-e937fdc8-1304-4384-a89e-bed9b03b0598.png`
- Atlas at Dawn: `exec-2d976620-33ae-4fec-836e-70ade49b99c5.png`
- The Last Lantern: `exec-fb8c913e-5769-4df3-ad80-b2a4d28baaf1.png`
- Letters to the Sea: `exec-46f0f1ef-fb17-49c6-bb23-8a5aa81070f5.png`
- Midnight Delivery: `exec-c6c16c83-d9ab-45e8-b5de-def7278c5bf1.png`
- The Glass Observatory: `exec-9b79afc3-dacc-46cd-a3e3-85d9cf6a6b63.png`

Web exports at `public/media/movies/<slug>.webp` are 768×1152, quality 82, effort 6, approximately 118–196 KiB each (about 1 MiB total). Exporting only resized/re-encoded the originals; there were no semantic edits or crops. The existing 2:3 card ratio displays the artwork without cutting its typography, and lazy loading remains enabled.

## Validation

All 48 tests passed against isolated Postgres. Type checking, lint (0 errors, 10 existing warnings) and production build passed. Checks cover the exact six MOVIE additions, coming-soon/no-video defaults, no invented dates/runtime, preservation of conflicting series and previously published rows, retention of owner edits/unpublishing/deletions after repeated production preparation, and preservation of account/community data. Local HTTP verification covers movie cards/poster delivery, Arabic/English names and search, coming-soon/available filters, detail pages without watch buttons, direct member watch previews and ordinary My List behavior. Browser viewport verification was unavailable; the generated artwork itself was visually inspected.
