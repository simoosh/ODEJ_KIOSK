# Data.md: known data problems

Every open problem with the establishments' data, in one place: coordinates, Facebook pages, names, types, contact details and media. Last update: 2026-11-01, after the batch odej-028 to 038.

## How to use this file

- **After each scrape**, add the establishment to section 8, move it out of section 9, and add its problems to the sections above them. Do it in the same PR as the batch.
- **When a problem is solved**, delete its line and add a `CHANGE` entry in `Update.md` saying who confirmed it. This file only lists what is still open. It is not append-only.
- **Never fix a value by guessing.** A problem stays here until the ODEJ, the owner or the colleague confirms the answer.
- Numbers are the establishment numbers: #16 is `odej-016`. "Scraped" means the media is collected.
- `docs/VERIFICATION.md` is generated from the data file and keeps the original audit. This file adds what the scrapes found.

## 1. Summary

| Topic | Count | Establishments |
|---|---|---|
| Collected and on the CDN | 34 of 67 | section 8 |
| Not scraped yet | 33 of 67 | section 9 |
| No usable Facebook page | 4 | #2, 14, 37, 49 |
| Pin in the wrong place, or shared with another establishment | 5 | #10, 16, 24, 32, 42 |
| No commune known | 7 | #27, 46, 48, 51, 53, 56, 60 |
| Page may belong to another place or name | 10 | #11, 27, 31, 33, 39, 46, 48, 51, 53, 56 |
| Contact details collected but not on the map | 30 | section 6 |
| No activities in the data | 67 | all |
| Description shown on the map | 2 of 67 | #3, 21 |
| Very little media | 4 | #11, 13, 19, 31 |

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

**Wrong or shared points: fix before the exhibition**

| # | Problem |
|---|---|
| 10, 32 | Identical coordinates. Both are in Souk El Tenine. |
| 16, 42 | Identical coordinates, in Béjaïa city. |
| 16 | The name and the page say El Kseur, but the point is about 21 km away in Béjaïa city. The pin is probably wrong. |
| 24 | The name says Barbacha, but the point is about 14 km north, near El Kseur. The page's address says Barbacha. |
| 46 | The page says Messissna, but the point is 150 m from #57 in Seddouk. #58 is also listed in M'Cisna. |

**Very close points: same site, or copied coordinates?**

| # | Distance |
|---|---|
| 34, 50 | 68 m (Tichy) |
| 44, 54 | 105 m (Kherrata) |
| 6, 19 | 143 m (Akbou and Guendouza) |
| 46, 57 | 152 m (Seddouk) |
| 21, 60 | 355 m (Ouzellaguen) |
| 29, 67 | 1.6 km (Darguina), same name |

**No commune in the data** (`placeId` is empty, so these do not appear under any commune)

| # | What we know |
|---|---|
| 27 | Between Adekar, Toudja and Beni Ksila. The page says Djebla. |
| 46 | Beside Seddouk. The page says Messissna. |
| 48 | On the coast, Beni Ksila sector. |
| 51 | Near Souk El Tenine and Melbou. |
| 53 | Near Souk El Tenine. |
| 56 | South of the wilaya, Ait R'zine and Ighil Ali sector. |
| 60 | 355 m from #21, Ouzellaguen. |

**Place names that are not communes:** #12 Senadla, 18 Takriets, 19 Guendouza, 26 Tizi El Oued, 31 Bermatane, 38 Adjiouane, 63 Laalam. Their parent commune needs confirming. The #38 page says Draa El Kaid.

**Limit of this check:** the data has no centre point for each commune, so a pin can't be measured against its commune automatically. Only the cases above were found, and other pins may still be off. Check each pin by eye on the map.

## 4. Facebook pages

**No usable page: these four cannot be scraped**

| # | Establishment | Why |
|---|---|---|
| 2 | Adekar Youth Hostel | The link failed on two separate checks. |
| 14 | Abadi Martyrs, Sidi Ayad | The link opened #15, Sidi Aich youth centre. |
| 37 | Tamokra sports complex | The link opened #39, Akfadou youth centre. |
| 49 | Assam Tayeb and son Hamimi, Tazmalt | The link opened #33, Tazmalt youth centre. |

**Page may not match the listed establishment**

| # | Listed as | The page says |
|---|---|---|
| 11 | Ait Salah Martyrs, sports complex | Ighil Ouazzoug sports complex |
| 27 | Martyr Banoun Akli | Djebla multi-activity hall (banner and page title). The media is published under #27. |
| 31 | Martyr Djeroud, Bermatane | Sidi Aich sports complex, and its e-mail is `cspsidiaich@` |
| 33 | Martyr Ouchiha Lahlou | The building banner reads «دار الشباب الشهيد عصام طيب و إبنه عصام حميمي (محمود)», which is #49. The media is published under #33 for now. |
| 39 | «بوعيدان أرزقي» | «بوعيفل أرزقي»: a different family name |
| 46 | Martyr Bouhedou Abdelhamid | Messissna youth centre |
| 48 | Martyr Touati Amar | Beni Ksila youth camp |
| 51 | Martyr Dehamla Mouloud | Melbou youth camp |
| 53 | Martyr Bouhraoua Amar | Souk El Tenine youth hostel |
| 56 | Mouloud Kacem Nait Belkacem | Ighil Ali youth centre |

**Weak pages:** #40 and #52 have no profile picture. #58 has 2 followers.

**Pages with posts Facebook labels as machine-generated:** #16, 28, 29, 30, 43, 48, 63. Check the photos from these pages before using them. #16, 28, 29 and 30 are already published.

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

**Not on the map yet.** `info.json` has contact details for #5, 7, 8, 9, 10, 11, 12, 13, 16, 17, 18, 19, 20, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 38 and 41, but the map shows contact details only for #1, 3, 4 and 21. `tools/data/import-info.mjs` still has to run. Fix the bad values below first.

**Bad or doubtful values** (they must not reach the map as they are)

| # | Field | Value or problem |
|---|---|---|
| 3 | Hours | "Toujours ouvert" is on the map as "Always open", which is unlikely to be true. |
| 13, 30, 33, 38 | Hours | "Toujours ouvert", same doubt. |
| 18 | Hours | "Ferme bientôt" is Facebook's live status, not a schedule. Do not import it. |
| 18 | Address | Contains a Google Maps link. |
| 18 | E-mail | A Gmail address, `mjttakariat@`, with an odd double t. Confirm it. |
| 26, 31 | Address | Only the word "Coordonnées". This is a scraping error. Do not import it. |
| 38 | Address | Only "Bejaïa, Algeria". The page text gives the village centre of Adjiouane, commune of Draa El Kaid. |
| 11, 33, 34, 35 | E-mail | A Gmail address, not an ODEJ one. Confirm it. |
| 24, 38 | E-mail | Looks like a person's private Gmail address. Confirm it before showing it on a public kiosk. |
| 21 | Phone | Starts with 044; other landlines here start with 034. The e-mail says Ighzer Amokrane while the establishment is Ouzellaguen. |
| 9, 31 | Phone | Starts with 030. Confirm it. |
| 3, 35, 41 | Phone | Mobile numbers. Confirm they are official, not personal. |
| 34 | Description | Reads like a generic template about an education community, not this sports complex. Do not import it. |
| 30 | Description | Written in Tamazight, in Latin letters. Needs a translation before it can be shown. |
| 3, 21 | Text | Description and hours translations are unverified. |

**Source of the values.** A value marked `odej-website` in `info.json` comes from the ODEJ's list, not from the establishment's page. Most e-mails and many phones are in this group, and they should be confirmed.

**Missing, among the 24 scraped**

| Field | Missing for |
|---|---|
| Phone | #7, 8, 24, 38 |
| E-mail | #41 |
| Address | #1, 5, 8, 10, 12, 16, 17, 21, 22, 25, 27, 28, 29, 32, 36 |
| Opening hours | all except #3, 13, 18, 30, 33 and 38, and those six are doubtful |
| Description | #1, 4, 5, 7, 8, 10, 11, 12, 16, 18, 20, 22, 24, 25, 27, 29, 31, 32, 35, 36, 41 |

**Whole dataset.** No establishment has activities. Only #3 and #21 show a description, and only #3 shows hours.

**Wrong Facebook category.** These are only labels on the page, but they should not be shown: #4 music and health, #5 restaurant, #12 interior decoration, #18 news site, #20 music, #25 product, #27 digital creator, #29 personal blog, #31 music.

## 7. Media

**Too little**

| # | Problem |
|---|---|
| 11 | Only one image: a cover 200 px wide. No gallery and no video. |
| 13 | 15 photos and no video. Its newest post is from October 2025. |
| 19 | Only 5 photos, but 7 videos. |
| 31 | The page has only 2 images: the building, used as the cover, and a flag, the only gallery photo. Its newest post is from August 2025. |
| 4, 5, 29, 31, 35 | No video on the page. |

**Cover**

| # | Problem |
|---|---|
| 3 | No cover at all, on the star establishment. |
| 1, 18, 22 | The cover is a logo, not the building. |
| 26, 27 | The cover is a group photo, not the building. |
| 5 | Cover 785 px wide, small for a large view. |
| 8 | The cover was supplied by the colleague. A scrappper rebuild of the manifest would put `preview.jpg` back. |

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

The colleague kept all of these. The list is here so the choice can be reviewed before the exhibition.

**Unused raw file.** `photos/photo-009.jpg` in the #35 folder was left by a crash of the scrappper. It is the same picture as `photo-010`, is not in the manifest and is not published.

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
| 41 | Chellata Youth Centre | 36 | 2 | e-mail | 6, 7 |

## 9. Not scraped yet

**Cannot be scraped until a page is found (4):** #2, 14, 37, 49.

**Ready to scrape (29).** The problems already known are in the sections above.

| Numbers | Known problems |
|---|---|
| 43, 48, 63 | Posts labelled as machine-generated (section 4) |
| 6, 42, 44, 46, 50, 54, 57, 60 | Coordinates (section 3) |
| 39, 48, 51, 53, 56 | Page, name or commune (sections 3 and 4) |
| 15, 64 | Spelling (section 5) |
| 40, 52, 58 | Weak page (section 4) |
| 59 | Type from the link only (section 5) |
| 45, 47, 55, 61, 62, 65, 66, 67 | None except #67, which shares its name with #29 |
