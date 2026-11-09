# Data.md: known data problems

Every open problem with the establishments' data, in one place: coordinates, Facebook pages, names, types, contact details and media. Last update: 2026-11-09, after the scrape of #44 to 48 and the copy of #33 as #49.

## How to use this file

- **After each scrape**, add the establishment to section 8, move it out of section 9, and add its problems to the sections above them. Do it in the same PR as the batch.
- **When a problem is solved**, delete its line and add a `CHANGE` entry in `Update.md` saying who confirmed it. This file only lists what is still open. It is not append-only.
- **Never fix a value by guessing.** A problem stays here until the ODEJ, the owner or the colleague confirms the answer.
- Numbers are the establishment numbers: #16 is `odej-016`. "Scraped" means the media is collected.
- `docs/VERIFICATION.md` is generated from the data file and keeps the original audit. This file adds what the scrapes found.

## 1. Summary

| Topic | Count | Establishments |
|---|---|---|
| Collected (on the CDN after the next publication) | 44 of 67 | section 8 |
| Not scraped yet | 23 of 67 | section 9 |
| No usable Facebook page | 4 | #2, 14, 37, 49 |
| Pin to confirm with the ODEJ (its table has a doubtful value) | 2 | #48, 67 |
| Commune to confirm | 4 | #13, 51, 64 and the English names of 3 new communes |
| Page may belong to another place or name | 11 | #11, 27, 31, 33, 39, 40, 46, 48, 51, 53, 56 |
| Contact details collected but not on the map | 40 | section 6 |
| No activities in the data | 67 | all |
| Description shown on the map | 2 of 67 | #3, 21 |
| Very little media | 5 | #11, 13, 19, 31, 51 |

## 2. Questions for the ODEJ, most urgent first

1. Does the media published under #33 belong to #49? The banner on the building names #49, not #33 (section 4). If so, what is the page of the real #33?
2. Which coordinates are right for #10 and #32, and for #16 and #42? Each pair has identical coordinates.
3. Where is #24 really? The point is about 14 km north of Barbacha.
4. Do #2, 14, 37 and 49 have a Facebook page? Can the ODEJ send photos for them?
5. Which commune do #27, 46, 48, 51, 53, 56 and 60 belong to?
6. Are the pages in section 4 really those establishments?
7. Are #29 and #67 two establishments? They have the same name, 1.6 km apart.
8. What is the type of #14 and #49? Are the 41 types read from page names correct?
9. Can the ODEJ supply descriptions, activities and opening hours? We have almost none.

## 3. Coordinates and geography

**Source of the coordinates (7 Nov 2026).** The ODEJ sent a table of GPS points after we reported the wrong ones. It replaces our pins for 65 of the 67 establishments, matched to each one by type, commune and name. The wrong or shared points listed before (#10 and 32, #16 and 42, #16, #24, #46 and 57, and the close pairs) are solved by it. Youth Connect's own points are wrong and are not used.

**Still open: the ODEJ's table has a doubtful value** (the pin was left as it was)

| # | Problem |
|---|---|
| 48 | The table says latitude 36.8830289, about 25 km out at sea. Our pin has the same problem. Probably 36.68, but ask the ODEJ. |
| 67 | The table gives the Adekar hostel's latitude, 36.6922415, which is offshore. Our old pin, in Darguina, stays. |

**Pins now very close (the table says so):** #29 and 67 (6 m, Darguina), #10 and 53 (29 m, Souk El Tenine), #13 and 59 (30 m, Tibane and El Flay), #44 and 54 (94 m, Kherrata), #34 and 50 (211 m, Tichy). Probably the same sites, but worth a look on the map.

**Communes (7 Nov 2026).** Every establishment has a place now. The commune of #27 and 48 (Beni Ksila), #46 (M'Cisna), #53 (Souk El Tenine), #56 (Ighil Ali) and #60 (Ouzellaguen) comes from Youth Connect and agrees with its address and the ODEJ's table. Three communes were added to `places`: Beni Ksila, Ighil Ali and Souk Oufella. Their Arabic names come from Youth Connect and their English spellings are unverified, like the others. The seven localities (Senadla, Takriets, Guendouza, Tizi El Oued, Bermatane, Adjiouane, Laalam) keep their names and now have a `communeId` (Draa El Kaid, Souk Oufella, Akbou, Melbou, Sidi Aich, Draa El Kaid, Tamridjet), taken from Youth Connect.

**Still to confirm with the ODEJ**

| # | Problem |
|---|---|
| 51 | Youth Connect's commune field says Souk El Tenine, but its address and the ODEJ's table say Melbou. We use Melbou. |
| 13 | Our place is Tibane, which is listed as a commune. Youth Connect says El Flay (Leflaye). |
| 64 | Our place is Taourirt Ighil, as in the ODEJ's table. Youth Connect says Adekar. |

**Limit of this check:** the data has no centre point for each commune, so a pin can't be measured against its commune automatically. Check a few pins by eye on the map.

## 4. Facebook pages

**No usable page: these four cannot be scraped**

| # | Establishment | Why |
|---|---|---|
| 2 | Adekar Youth Hostel | The link failed on two separate checks. |
| 14 | Abadi Martyrs, Sidi Ayad | The link opened #15, Sidi Aich youth centre. |
| 37 | Tamokra sports complex | The link opened #39, Akfadou youth centre. The #39 scrape confirms it: the building and the first video show the sign "MAISON DE JEUNES AKFADOU". |
| 49 | Assam Tayeb and son Hamimi, Tazmalt | The link opened #33, Tazmalt youth centre. Not scraped: the colleague gave #49 a copy of #33's folder (9 Nov). Both are flagged `DUPLICATE_LINK` in `odej-bejaia.json`. |

**Page may not match the listed establishment**

| # | Listed as | The page says |
|---|---|---|
| 11 | Ait Salah Martyrs, sports complex | Ighil Ouazzoug sports complex |
| 27 | Martyr Banoun Akli | Djebla multi-activity hall (banner and page title). The media is published under #27. |
| 31 | Martyr Djeroud, Bermatane | Sidi Aich sports complex, and its e-mail is `cspsidiaich@` |
| 33 | Martyr Ouchiha Lahlou | The building banner reads «دار الشباب الشهيد عصام طيب و إبنه عصام حميمي (محمود)», which is #49. The media is published under #33 for now. |
| 39 | «بوعيدان أرزقي» | «بوعيفل أرزقي»: a different family name |
| 40 | Page `profile.php?id=61579953660171` | The scrape read `mj.aokas.2025` («MJ Aokas»), another page of the same youth centre. `video-001` came from the numeric page, so the manifest marks it as from another owner. Its content looks like Aokas. Which page is the official one? |
| 46 | Martyr Bouhedou Abdelhamid | Messissna youth centre |
| 48 | Martyr Touati Amar | Beni Ksila youth camp |
| 51 | Martyr Dehamla Mouloud | Melbou youth camp |
| 53 | Martyr Bouhraoua Amar | Souk El Tenine youth hostel |
| 56 | Mouloud Kacem Nait Belkacem | Ighil Ali youth centre |

**Scraped, nothing found**

| # | Problem |
|---|---|
| 52 | Scraped twice on 9 Nov (03:16 and 03:24). Both runs failed with "Nothing was found". The page resolves (title «بيت الشباب الاخوة سوماري- ولاية بجاية», 36 followers) and `info.json` was saved from Youth Connect, but `gallery-dl` returned no photos and 0 videos were visible. Either the page has no public photos, or Facebook shows nothing to a logged-out visitor. No media folder content, so no cover. Ask the ODEJ for photos or another page. |

**Weak pages:** #40 and #52 have no profile picture. #58 has 2 followers.

**Pages with posts Facebook labels as machine-generated:** #16, 28, 29, 30, 43, 48, 63. Check the photos from these pages before using them. #16, 28, 29, 30 and 43 are already published.

## 5. Names and types

| # | Problem |
|---|---|
| 3 | Written «واد غير»; the official commune name is «وادي غير». |
| 15 | «عيماد»: check the spelling («عماد»?). |
| 18 | The English name says Takriets; the establishment's own logo says Takariet. |
| 24 | The data says «بن تجي»; the raw folder says «بن تحي». Which is right? |
| 29, 67 | Same name. The audit says two different establishments, a sports complex and a hostel. |
| 36 | Written «تيزي انبربر»; the official name is «تيزي نبربر». |
| 37 | Written «تمقرة»; the official name is «تامقرة». |
| 49 | The cell in the PDF was cut off («لشهداء»), read as «الشهداء». The list says «عصم»; the banner seen on the #33 cover says «عصام». |
| 64 | Written «تاوريت إغيل»; the official name is «تاوريرت إغيل». |

**Types**

- No type at all: #14, 49. They show as a generic "Youth facility".
- Type taken from the Facebook link only: #32, 50, 59.
- Type taken from the page name: 41 establishments, listed in `docs/VERIFICATION.md`. All need confirming.
- English names: the official French spellings are still missing, so the English names are unverified.

## 6. Contact details and page information

**Not on the map yet.** `info.json` has contact details for #5, 7, 8, 9, 10, 11, 12, 13, 16, 17, 18, 19, 20, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48 and 49, but the map shows contact details only for #1, 3, 4 and 21. `tools/data/import-info.mjs` still has to run. Fix the bad values below first.

**Bad or doubtful values** (they must not reach the map as they are)

| # | Field | Value or problem |
|---|---|---|
| 3 | Hours | "Toujours ouvert" is on the map as "Always open", which is unlikely to be true. |
| 13, 30, 33, 38, 49 | Hours | "Toujours ouvert", same doubt. |
| 18 | Hours | "Ferme bientôt" is Facebook's live status, not a schedule. Do not import it. |
| 42 | Hours | "Fermé en ce moment" is Facebook's live status, not a schedule. Do not import it. |
| 39 | Address | Youth Connect's «بلدية أكفادو بجاية» is kept. The Facebook value was the page's title, not an address. |
| 42 | Address | Youth Connect's «بلدية بجاية» is kept. Facebook gives the establishment's name with the city, which is not more precise. |
| 18 | Address | Contains a Google Maps link. |
| 18 | E-mail | A Gmail address, `mjttakariat@`, with an odd double t. Confirm it. |
| 26, 31 | Address | Only the word "Coordonnées". This is a scraping error. Do not import it. |
| 38 | Address | Only "Bejaïa, Algeria". The page text gives the village centre of Adjiouane, commune of Draa El Kaid. |
| 11, 33, 34, 35, 39 | E-mail | A Gmail address, not an ODEJ one. Confirm it. |
| 24, 38 | E-mail | Looks like a person's private Gmail address. Confirm it before showing it on a public kiosk. |
| 21, 47 | Phone | Starts with 044; other landlines here start with 034. The e-mail says Ighzer Amokrane while the establishment is Ouzellaguen. |
| 9, 31 | Phone | Starts with 030. Confirm it. |
| 3, 35, 41 | Phone | Mobile numbers. Confirm they are official, not personal. |
| 34 | Description | Reads like a generic template about an education community, not this sports complex. Do not import it. |
| 30 | Description | Written in Tamazight, in Latin letters. Needs a translation before it can be shown. |
| 3, 21 | Text | Description and hours translations are unverified. |

**Source of the values (rule of 7 Nov 2026).** E-mail and phone: the Facebook page first, and Youth Connect (the Ministry's platform) only when Facebook shows nothing. Address, description, founding year, capacity, accessibility and activities: Youth Connect. The ODEJ website is not a source any more, because it was hacked and taken down: no value from it remains. `sources` in each `info.json` says where each value comes from, and `youthConnect.conflicts` keeps the Youth Connect value when it differs from the one we use. The coordinates of Youth Connect are not read: the ODEJ's PDF of 6 Nov replaces them.

**Youth Connect import: what to check**

| # | Problem |
|---|---|
| 1 | The e-mail `cspadekar@odegbejaia-dz.com` has a typo in the domain (`odegbejaia`). Other pages use `odejbejaia-dz.com`. Confirm it. |
| 38 | No phone: Youth Connect only has a placeholder, `000 00 00 00`, so the phone stays empty. The same placeholder was dropped for #41, 43, 61, 63. |
| 11, 13, 18, 24, 26, 31, 33, 34, 35, 38, 39 | The Facebook e-mail is kept, but Youth Connect gives a different one. For #24, 33, 35 and 39 the Facebook one is a private-looking Gmail address and Youth Connect gives an ODEJ one. Ask the ODEJ which is right. |
| 3, 9, 33, 35 | The Facebook phone is kept, but Youth Connect gives a different number. |
| 47 | The Facebook e-mail, a Gmail address, is kept; Youth Connect gives `ajouzellaguen@odejbejaia-dz.com`. Ask the ODEJ. |
| 48 | The Facebook mobile `0776 76 64 17` is kept; Youth Connect gives the landline `034 28 31 51`. Ask the ODEJ. |
| 49 | A copy of #33: it has the same e-mail and phone conflicts as #33. |
| 3, 7 | Youth Connect gives the same phone, `034 17 91 75`, to both. For #3 the Facebook mobile is kept. Confirm #7. |
| 13, 15 | Youth Connect writes the e-mail domain as `odejbejaia-de.com` (#13) and `idejbejaia-dz.com` (#15): typos, not used for #13, and #15 is not collected yet. |
| All | Youth Connect has only about 20 different descriptions for 67 establishments: they are text per type, not about each place. 20 of the 34 files have activities. |

**Missing, among the 44 scraped**

| Field | Missing for |
|---|---|
| Phone | #38, 43 (Youth Connect has only the placeholder for #43, and Facebook shows none) |
| E-mail | none |
| Address | none (from Youth Connect), but #18, 26, 31 and 38 had a bad Facebook address, now replaced |
| Opening hours | all except #3, 13, 18, 30, 33, 38 and 42, and those seven are doubtful |
| Activities | 24 of the 38 files have some |
| Description | none, but see the generic texts above |

**Whole dataset.** No establishment has activities. Only #3 and #21 show a description, and only #3 shows hours.

**Wrong Facebook category.** These are only labels on the page, but they should not be shown: #4 music and health, #5 restaurant, #12 interior decoration, #18 news site, #20 music, #25 product, #27 digital creator, #29 personal blog, #31 music, #40 and 43 music and health, #45 and 46 music. #48 has no category and no follower count.

## 7. Media

**Too little**

| # | Problem |
|---|---|
| 11 | Only one image: a cover 200 px wide. No gallery and no video. |
| 13 | 15 photos and no video. Its newest post is from October 2025. |
| 19 | Only 5 photos, but 7 videos. |
| 51 | The page has only 3 images, and they are the same view of the building under flag bunting: the cover, `photo-001` (the scrappper marks it a duplicate of the cover) and `photo-002`. No video. The colleague searched for another page and found none. Ask the ODEJ for photos, or for a better page. |
| 31 | The page has only 2 images: the building, used as the cover, and a flag, the only gallery photo. Its newest post is from August 2025. |
| 4, 5, 29, 31, 35 | No video on the page. |

**Cover**

| # | Problem |
|---|---|
| 3 | No cover at all, on the star establishment. |
| 1, 18, 22 | The cover is a logo, not the building. |
| 26, 27 | The cover is a group photo, not the building. |
| 5 | Cover 785 px wide, small for a large view. |
| 45 | No cover on the page. The colleague supplied a building photo (680 px, upscaled 2x to 1360 px, 9 Nov) as `preview/preview.jpg`, set by hand. A scrappper rebuild of the manifest would drop it. The upscale adds no detail. |
| 49 | The cover is #33's (copy of its folder). |
| 8 | The cover was supplied by the colleague. A scrappper rebuild of the manifest would put `preview.jpg` back. |
| 43 | The page had no cover. The colleague supplied a photo of the building (960 px, 9 Nov) as `preview/preview.jpg` and set it in the manifest by hand. A scrappper rebuild of the manifest would drop it. |
| 39 | Cover 638 px wide, a smaller copy of the building photo. Sharp enough at 720p, weak on a large view. |
| 40 | The cover shows the building with a red text overlay («Maison de jeunes Harriche Mohand Aokas»). |
| 42 | The cover is the only outside photo: the building is dark and half the frame is sky. |

**Videos that failed or changed**

| # | Problem |
|---|---|
| 10 | One video could not be read during the scrape (network error). It was not retried. |
| 12 | One Facebook video is damaged and missing. `video-02` was added by hand, so a manifest rebuild would drop it. |
| 25 | One Facebook video is damaged and missing. |
| 34 | One video could not be read during the scrape (network error). It was not retried. |
| 28 | `video-01` runs 121 s, over the 70 s default. It was compressed harder to fit the 24 MiB limit (31.5 to 18.0 MiB). Check its quality. |
| 38 | `video-01` runs 138 s, over the 70 s default. |
| 16 | `video-02` runs 90 s, over the 70 s default. |
| 21 | `video-02` was cut from 170 s to 70 s. |
| 10 | Three low-resolution videos, 360 to 480 px wide. |
| 42 | `video-01` runs 161 s, over the 70 s default. It is only 540 px wide and 5.7 MB. |
| 40 | `video-01` comes from the numeric page, not the scraped one (section 4). |
| 45 | `video-01` runs 115 s, over the 70 s default. VP9 source, optimized to 3.3 MB. |
| 47 | `video-01` runs 105 s, over the 70 s default, and is only 480 px wide. |
| 48 | `video-02` came out at 28.7 MiB after the standard encode, over the 24 MiB limit. It was rebuilt harder (CRF 29, 2 Mbit/s cap) to 14.7 MiB. Check its quality. `video-01` and `video-02` are portrait and run 68 s and 70 s. |
| 46 | `video-02` and `video-03` are 368 and 360 px wide. |
| 39, 40 | Low-resolution videos: all three of #39 (360 to 368 px wide) and #40 `video-01` (360 px). |

Facebook shows a logged-out visitor only about 10 videos per page, so video lists may be incomplete.

**Low-resolution photos** (under 600 px wide, weak even at 720p; `photo-` files in the raw folder)

| # | Files |
|---|---|
| 3 | 006 |
| 4 | 022, 023 |
| 5 | 015 to 019 |
| 10 | 020 |
| 12 | 032, 033 |
| 13 | 001, 013, 016 |
| 16 | 001 |
| 17 | 030 to 032 |
| 19 | 001 |
| 22 | 001, 023 |
| 23 | 006, 008, 037 |
| 26 | 015, 017, 018, 019 |
| 29 | 002 |
| 36 | 002 |
| 40 | 018 (590 px), 020 (461 px) |
| 44 | 013 (548 px), 017 (585 px), 019 (499 px) |
| 41 | 012, 025, 026, 027, 036, 037 |

**Near-duplicates kept**

| # | Files |
|---|---|
| 5 | 004, 023, 024 (same hike) |
| 18 | 011, 012 |
| 22 | 035, 038 |
| 26 | 023 (almost the cover), and 031, 032 |
| 35 | 005, 010 |
| 36 | 044, 048 |
| 39 | 014, 015 (015 is overexposed), and 034, 035 (035 is 720 px wide) |
| 40 | 019, 020, 024 (same table), and 018, 022 |
| 42 | 002, 003, and 005, 006, 007, and 015, 016, and 028, 029 |
| 43 | 014, 015, and 023, 024 |
| 44 | 029, 030, and 031, 033, and 022 to 024, and 025, 026, and 036 to 038 |
| 45 | 013 to 015, 016 to 018, 024, 025, and 026, 028, 030 |
| 46 | 036, 038 (the scrappper flags 038), 011 to 013, and 024 to 026 |
| 47 | 010, 012, and 007, 008, and 015 to 017 |
| 48 | 006, 007 |
| 49 | The same as #33 |

**Posters with small text**

| # | Files |
|---|---|
| 5 | 13 of 28 photos |
| 7 | 003 |
| 9 | 003, 012, 026 |
| 18 | 008, 009, 010, 015 |
| 22 | 014 |
| 23 | 026, 035 (035 also shows a mobile number) |
| 24 | 019 |
| 28 | 041 |
| 30 | 002 |
| 35 | 017 to 022 (six almost identical sign-up posters) |
| 39 | 024 (archive photos about 17 October 1961, small captions) |
| 40 | 006, 026 (handwritten boards), 015, 030 (leaflets; 030 also shows a phone stamp) |
| 42 | 020, 022, 026 |
| 46 | 004, 005 (photographed paper posters of dense Arabic text) |

**Weak or off-topic photos**

| # | Files |
|---|---|
| 7 | 002 (a memorial in Algiers) |
| 8 | 001 (advertising banner) |
| 10 | Several with a burned-in date stamp |
| 18 | 013, 014, 025 (the last one is a cow) |
| 24 | 021, 037 (laptop screens), 035 (stacked chairs), 036 (dark) |
| 25 | 031, 032 (camera watermark frame) |
| 26 | 034 to 036 (radio studio), 043 to 048 (trips) |
| 27 | 023, 025 (Martyrs' Memorial in Algiers) |
| 31 | 002 (a flag, no activity) |
| 33 | 002, 003, 009, 010, 013 (tilted) |
| 38 | 023, 037 (social media frame) |
| 39 | 028, 029, 030, 033, 034 (a football tournament on a city pitch: maybe away, maybe #37's), 017 (fabric on a table), 018, 023 (dark stage) |
| 40 | 013 (Directorate watermark), 033 to 038 (plants, a warehouse and volunteers: maybe another site) |
| 42 | 021, 027 (hands only) |
| 44 | 014 to 018 (outings: a lake, a mountain, a farm) |
| 45 | 021 (a wildfire), 033 (a police checkpoint), 032, 034, 013 to 020 (an aid event and a training centre, maybe another body's) |
| 46 | 017 to 022 (a beach clean-up, a fire engine, a school trip) |
| 47 | 014 (a staged scene with a rifle), 023 (a toilet pipe) |
| 48 | 020 (a banner), 022, 023, 026 (adult groups, a civil-protection visit) |
| 43 | 004 (dark), 010 (group in front of a sign naming another hall), 011 (a landscape), 020 (a banner, 707 px), 021 to 025 (tree planting away from the building) |

The colleague kept all of these. The list is here so the choice can be reviewed before the exhibition.

**Unused raw file.** `photos/photo-009.jpg` in the #35 folder was left by a crash of the scrappper. It is the same picture as `photo-010`, is not in the manifest and is not published.

**Damaged raw files (9 Nov 2026).** Five raw files were overwritten by contact sheets during an automatic review: #46 `photo-020`, and #48 `photo-008`, `016`, `024` and `031`. Their sha256 no longer match the manifest, and the gallery images made from them are the contact sheets. The colleague chose to publish them as they are. To fix: re-download each from the `sourceUrl` in its manifest, check the sha256, delete the matching `gallery-NN.webp` (its number is in `docs/media/odej-046.json` or `odej-048.json`; the optimizer skips files that exist), rerun the optimizer, and publish again.

**Children in photos.** Decision D10, as extended on 2026-11-01, says the ODEJ agreement covers all platform media. Nothing to do per file. The owner keeps the written trace.

**Backup.** Raw files are on one disk. Refresh the external copy after each scrape.

## 8. Scraped establishments

Photos and videos count what is published, without the cover. "Contact gaps" lists what `info.json` lacks. The last column points to the sections above.

| # | Establishment | Photos | Videos | Contact gaps | Problems in |
|--:|---|--:|--:|---|---|
| 1 | Adekar Local Sports Complex | 23 | 2 | address | 6, 7 |
| 3 | Oued Ghir Science Leisure Centre | 35 | 6 | none | 5, 6, 7 |
| 4 | Hamia Mohand Cherif Local Sports Complex | 27 | 0 | none | 6, 7 |
| 5 | Martyr Ouaglis Mohand Akli | 27 | 0 | address | 6, 7 |
| 7 | Martyr Hamai Bachir | 32 | 1 | phone | 6, 7 |
| 8 | Mujahid Mohamed Boudiaf | 26 | 1 | phone, address | 6, 7 |
| 9 | El Kseur Local Sports Complex | 28 | 1 | none | 6, 7 |
| 10 | Martyr Bouhired Said | 23 | 3 | address | 3, 6, 7 |
| 11 | Ait Salah Martyrs | 0 | 0 | none | 4, 6, 7 |
| 12 | Martyr Khaldi Abdelkader | 38 | 2 | address | 3, 6, 7 |
| 13 | Tibane Youth Centre | 15 | 0 | none | 6, 7 |
| 16 | Mouloud Feraoun | 38 | 2 | address | 3, 4, 6, 7 |
| 17 | Martyr Abderrahmane Fares | 33 | 3 | address | 6, 7 |
| 18 | Takriets Youth Centre | 43 | 2 | none | 3, 5, 6, 7 |
| 19 | Martyr Maadaoui Bouelsaad | 5 | 7 | none | 3, 6, 7 |
| 20 | Tifra Local Sports Complex | 24 | 1 | none | 6 |
| 21 | Martyr Chila Tayeb | 30 | 2 | address | 3, 6, 7 |
| 22 | Barbacha Local Sports Complex | 46 | 2 | address | 6, 7 |
| 23 | Ait R'zine Youth Centre | 40 | 2 | none | 6, 7 |
| 24 | Martyr Bentedji Mohand Akli | 36 | 3 | phone | 3, 5, 6, 7 |
| 25 | 18 February Martyrs' Day | 37 | 1 | address | 6, 7 |
| 26 | Tizi El Oued Youth Centre | 47 | 3 | address (bad value) | 3, 6, 7 |
| 27 | Martyr Banoun Akli | 40 | 4 | address | 3, 4, 6, 7 |
| 28 | Martyr Smail Ali Benaissa | 49 | 3 | address | 4, 6, 7 |
| 29 | Martyr Aiouz Slimane | 41 | 0 | address | 4, 5, 6, 7 |
| 30 | Seddouk Local Sports Complex | 35 | 1 | none | 4, 6, 7 |
| 31 | Martyr Djeroud | 1 | 0 | address (bad value) | 3, 4, 6, 7 |
| 32 | Martyr Amara Amar | 40 | 2 | address | 3, 5 |
| 33 | Martyr Ouchiha Lahlou | 48 | 2 | none | 4, 5, 6, 7 |
| 34 | Martyr Sebahi Mohand | 46 | 4 | none | 3, 6, 7 |
| 35 | Martyr Berkani Tahar | 32 | 0 | none | 6, 7 |
| 36 | Chaabane Amar | 55 | 1 | address | 5, 6, 7 |
| 38 | Martyr Belghania Ahmed | 41 | 1 | phone, address (too vague) | 3, 6, 7 |
| 39 | Martyr Bouaidane Arezki | 37 | 3 | none | 4, 6, 7 |
| 40 | Martyr Harrich Mohand | 37 | 2 | none | 4, 6, 7 |
| 41 | Chellata Youth Centre | 36 | 2 | e-mail | 6, 7 |
| 42 | Martyr Fatma Remtani | 28 | 1 | none | 6, 7 |
| 43 | Feraoun Youth Centre | 26 | 2 | phone | 4, 6, 7 |
| 44 | Martyr Messali Ali | 39 | 2 | none | 6, 7 |
| 45 | Martyr Boufroura Mohamed Benali | 36 | 1 | none | 6, 7 |
| 46 | Martyr Bouhaddou Abdelhamid | 38 | 3 | none | 4, 6, 7 |
| 47 | Helouane Youth Hostel | 30 | 1 | none | 6, 7 |
| 48 | Martyr Touati Amar | 30 | 2 | none | 3, 4, 6, 7 |
| 49 | Martyrs Assem Tayeb and his son Hamimi (copy of #33) | 48 | 2 | none | 4, 6, 7 |

## 9. Not scraped yet

**Cannot be scraped until a page is found (3):** #2, 14, 37. #49 shares #33's page and uses a copy of its folder (section 4).

**Ready to scrape (20).** The problems already known are in the sections above.

| Numbers | Known problems |
|---|---|
| 63 | Posts labelled as machine-generated (section 4) |
| 6, 50, 54, 57, 60 | Coordinates (section 3) |
| 51, 53, 56 | Page, name or commune (sections 3 and 4) |
| 15, 64 | Spelling (section 5) |
| 52 | Tried twice, nothing found (section 4) |
| 58 | Weak page (section 4) |
| 59 | Type from the link only (section 5) |
| 55, 61, 62, 65, 66, 67 | None except #67, which shares its name with #29 |
