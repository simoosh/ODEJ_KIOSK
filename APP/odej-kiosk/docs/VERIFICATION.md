# Vérification de la liste ODEJ Béjaïa

Fichier généré par `tools/data/build-verification.mjs`. Ne pas l'éditer à la main.

Source : liste PDF de 67 établissements (nom, latitude, longitude, lien Facebook), puis audit des pages Facebook du 30/10/2026.
Les coordonnées et les liens ont été extraits du texte du PDF ; les noms arabes ont été relus sur les pages.

- 67 établissements, tous situés dans l'emprise de la wilaya (lat. 36,34 → 36,88 ; long. 4,38 → 5,44).
- 10 lignes sans remarque.
- 2 établissements sans type (lignes 14, 49) : ils apparaissent comme « مؤسسة شبانية / Youth facility ».
- Les paramètres de suivi des liens Facebook (`mibextid`, `sk`) ont été retirés.

## À corriger avant le salon

| N° | Établissement | Remarque |
|---|---|---|
| 10 | الشهيد بوحيرد السعيد سوق الإثنين | Coordonnées identiques à la ligne 32. |
| 16 | مولود فرعون القصر | Coordonnées identiques à la ligne 42. |
| 16 | مولود فرعون القصر | Le nom cite El Kseur mais les coordonnées tombent en ville de Béjaïa (≈ 21 km d'El Kseur), identiques à la ligne 42. |
| 24 | الشهيد بن تجي محند أكلي برباشة | Le nom cite Barbacha mais le point est à ≈ 14 km au nord de Barbacha, près d'El Kseur. |
| 29 | الشهيد عيوز سليمان درقينة | Même nom que la ligne 67, à 1.6 km : doublon ou deux établissements distincts ? |
| 32 | الشهيد عمارة عمار سوق الإثنين | Coordonnées identiques à la ligne 10. |
| 42 | الشهيدة فاطمة رمطاني بجاية | Coordonnées identiques à la ligne 16. |
| 67 | الشهيد عيوز سليمان درقينة | Même nom que la ligne 29, à 1.6 km : doublon ou deux établissements distincts ? |

## À confirmer

| N° | Établissement | Remarque |
|---|---|---|
| 3 | مركز الترفيه العلمي واد غير | Écrit « واد غير » ; nom officiel de la commune : وادي غير. |
| 6 | بيت الشباب أقبو | À 143 m de la ligne 19 : même site ou coordonnées recopiées ? |
| 12 | الشهيد خالدي عبد القادر صنادلة | « صنادلة » est un lieu-dit : commune de rattachement à confirmer. |
| 15 | عيماد العربي سيدي عيش | « عيماد » : orthographe à confirmer (عماد ؟). |
| 18 | دار الشباب تقريت | « تقريت » est un lieu-dit : commune de rattachement à confirmer. |
| 19 | الشهيد معداوي بوالسعد قندوزة | À 143 m de la ligne 6 : même site ou coordonnées recopiées ? |
| 19 | الشهيد معداوي بوالسعد قندوزة | « قندوزة » est un lieu-dit : commune de rattachement à confirmer. |
| 26 | دار الشباب تيزي الواد | « تيزي الواد » est un lieu-dit : commune de rattachement à confirmer. |
| 27 | الشهيد بانون أكلي | Aucune commune dans le nom ; le point se situe entre Adekar, Toudja et Beni Ksila. |
| 31 | الشهيد جرود برمطان | « برمطان » est un lieu-dit : commune de rattachement à confirmer. |
| 32 | الشهيد عمارة عمار سوق الإثنين | Type déduit du lien Facebook, à confirmer. |
| 34 | الشهيد سباحي محند تيشي | À 68 m de la ligne 50 : même site ou coordonnées recopiées ? |
| 36 | شعبان اعمر تيزي انبربر | Écrit « تيزي انبربر » dans la liste ; nom officiel de la commune : تيزي نبربر. |
| 37 | مركب رياضي جواري تمقرة | Écrit « تمقرة » dans la liste ; nom officiel de la commune : تامقرة. |
| 38 | الشهيد بلغانية أحمد أجيوان | « أجيوان » est un lieu-dit : commune de rattachement à confirmer. |
| 44 | الشهيد مسالي علي خراطة | À 105 m de la ligne 54 : même site ou coordonnées recopiées ? |
| 46 | الشهيد بوهدو عبد الحميد | À 152 m de la ligne 57 : même site ou coordonnées recopiées ? |
| 46 | الشهيد بوهدو عبد الحميد | Aucune commune dans le nom ; le point est dans Seddouk, à 150 m de la ligne 57. |
| 48 | الشهيد تواتي اعمر | Aucune commune dans le nom ; le point est sur la côte, secteur Beni Ksila. |
| 49 | الشهداء عصم الطيب وابنه حميمي تازمالت | Cellule tronquée dans la liste (« لشهداء ») : lu « الشهداء ». |
| 50 | الشهيد سعدلي العيد تيشي | À 68 m de la ligne 34 : même site ou coordonnées recopiées ? |
| 50 | الشهيد سعدلي العيد تيشي | Type déduit du lien Facebook, à confirmer. |
| 51 | الشهيد دهاملة مولود | Aucune commune dans le nom ; le point est près de Souk El Ténine / Melbou. |
| 53 | الشهيد بوهراوة اعمر | Aucune commune dans le nom ; le point est près de Souk El Ténine. |
| 54 | الشهيد مسعودي رابح خراطة | À 105 m de la ligne 44 : même site ou coordonnées recopiées ? |
| 56 | مولود قاسم نايت بلقاسم | Aucune commune dans le nom ; le point est au sud de la wilaya, secteur Aït R'zine / Ighil Ali. |
| 57 | بركاني مجيد صدوق | À 152 m de la ligne 46 : même site ou coordonnées recopiées ? |
| 59 | الشهيد آيت يحي خلاف الفلاي | Type déduit du lien Facebook, à confirmer. |
| 60 | الشهيد معوش حاج لعمارة | Aucune commune dans le nom ; le point est à 355 m de la ligne 21 (Ouzellaguen). |
| 63 | دار الشباب لعلام | « لعلام » est un lieu-dit : commune de rattachement à confirmer. |
| 64 | الشهيد بوعيطة عبدالرحمان تاوريت إغيل | Écrit « تاوريت إغيل » dans la liste ; nom officiel de la commune : تاوريرت إغيل. |

## Corrections issues de l'audit

Établissement phare : 3 (مركز الترفيه العلمي واد غير).

### Types déduits du nom de la page Facebook (41)

| N° | Établissement | Type retenu | Origine |
|---|---|---|---|
| 5 | الشهيد أوغليس محند أكلي أميزور | مركب رياضي جواري | Type déduit du nom de la page Facebook (« المركب الرياضي الجواري أميزور-ولاية بجاية »), à confirmer par l'ODEJ. |
| 7 | الشهيد حماي بشير شميني | مركب رياضي جواري | Type déduit du nom de la page Facebook (« المركب الرياضي الجواري- شميني ولاية بجاية »), à confirmer par l'ODEJ. |
| 8 | المجاهد المرحوم محمد بوضياف أوقاس | بيت الشباب | Type déduit du nom de la page Facebook (« بيت الشباب اوقاس ولاية بجاية »), à confirmer par l'ODEJ. |
| 10 | الشهيد بوحيرد السعيد سوق الإثنين | دار الشباب | Type déduit du nom de la page Facebook (« دار الشباب الشهيد بوحيرد سعيد سوق الاثنين -ولاية بجاية- »), à confirmer par l'ODEJ. |
| 11 | الشهداء آيت صالح بجاية | مركب رياضي جواري | Type déduit du nom de la page Facebook (« المركب الرياضي الجواري اغيل اوعزوق بجاية »), à confirmer par l'ODEJ. |
| 12 | الشهيد خالدي عبد القادر صنادلة | دار الشباب | Type déduit du nom de la page Facebook (« دار الشباب الصنادلة-ولاية بحاية »), à confirmer par l'ODEJ. |
| 15 | عيماد العربي سيدي عيش | دار الشباب | Type déduit du nom de la page Facebook (« دار الشباب سيدي عيش - ولاية بجاية »), à confirmer par l'ODEJ. |
| 16 | مولود فرعون القصر | دار الشباب | Type déduit du nom de la page Facebook (« دار الشباب القصر-ولاية بجاية »), à confirmer par l'ODEJ. |
| 17 | الشهيد عبد الرحمان فارس أقبو | دار الشباب | Type déduit du nom de la page Facebook (« دار الشباب اقبو- ولاية بجاية »), à confirmer par l'ODEJ. |
| 19 | الشهيد معداوي بوالسعد قندوزة | دار الشباب | Type déduit du nom de la page Facebook (« دار الشباب قندوزة - ولاية بجاية »), à confirmer par l'ODEJ. |
| 21 | الشهيد شيلا الطيب أوزلاقن | مركب رياضي جواري | Type déduit du nom de la page Facebook (« المركب الرياضي الجواري أوزلاقن - ولاية بجاية »), à confirmer par l'ODEJ. |
| 24 | الشهيد بن تجي محند أكلي برباشة | دار الشباب | Type déduit du nom de la page Facebook (« دار الشباب برباشة-ولاية بجاية »), à confirmer par l'ODEJ. |
| 25 | يوم الشهيد 18 فيفري تامريجت | دار الشباب | Type déduit du nom de la page Facebook (« دار الشباب تامريجت -ولاية بجاية- »), à confirmer par l'ODEJ. |
| 27 | الشهيد بانون أكلي | قاعة متعددة الخدمات | Type déduit du nom de la page Facebook (« قاعة متعددة النشاطات جبلة ولاية بجاية »), à confirmer par l'ODEJ. |
| 28 | الشهيد اسماعيل علي بن عيسى أوقاس | مركب رياضي جواري | Type déduit du nom de la page Facebook (« المركب الرياضي الجواري أوقاس -ولاية بجاية »), à confirmer par l'ODEJ. |
| 29 | الشهيد عيوز سليمان درقينة | مركب رياضي جواري | Type déduit du nom de la page Facebook (« المركب الرياضي الجواري الشهيد عيوز سليمان درڤينة ولاية بجاية »), à confirmer par l'ODEJ. |
| 31 | الشهيد جرود برمطان | مركب رياضي جواري | Type déduit du nom de la page Facebook (« المركب الرياضي الجواري سيدي عيش-ولاية بجاية »), à confirmer par l'ODEJ. |
| 33 | الشهيد أوشيحة لحلو تازمالت | دار الشباب | Type déduit du nom de la page Facebook (« دار الشباب تازمالت- بجاية »), à confirmer par l'ODEJ. |
| 34 | الشهيد سباحي محند تيشي | مركب رياضي جواري | Type déduit du nom de la page Facebook (« المركب الرياضي الجواري تيشي-بجاية »), à confirmer par l'ODEJ. |
| 35 | الشهيد بركاني طاهر تيمزريت | مركب رياضي جواري | Type déduit du nom de la page Facebook (« المركب الرياضي الجواري تيمزريت - ولاية بجاية »), à confirmer par l'ODEJ. |
| 36 | شعبان اعمر تيزي انبربر | مركب رياضي جواري | Type déduit du nom de la page Facebook (« المركب الرياضي الجواري تيزي نبربر - ولاية بجاية »), à confirmer par l'ODEJ. |
| 38 | الشهيد بلغانية أحمد أجيوان | دار الشباب | Type déduit du nom de la page Facebook (« دار الشباب اجيوان -ولاية بجاية »), à confirmer par l'ODEJ. |
| 39 | الشهيد بوعيدان أرزقي أكفادو | دار الشباب | Type déduit du nom de la page Facebook (« دار الشباب أكفادو - الشهيد بوعيفل أرزقي- ولاية بجاية »), à confirmer par l'ODEJ. |
| 40 | الشهيد حريش محند أوقاس | دار الشباب | Type déduit du nom de la page Facebook (« دار الشباب اوقاس-ولاية بجاية »), à confirmer par l'ODEJ. |
| 42 | الشهيدة فاطمة رمطاني بجاية | دار الشباب | Type déduit du nom de la page Facebook (« دار الشباب فاطمة رمطاني - ولاية بجاية »), à confirmer par l'ODEJ. |
| 44 | الشهيد مسالي علي خراطة | دار الشباب | Type déduit du nom de la page Facebook (« دار الشباب خراطة - ولاية بجاية »), à confirmer par l'ODEJ. |
| 45 | الشهيد بوفرورة محمد بن علي ملبو | دار الشباب | Type déduit du nom de la page Facebook (« دار الشباب الشهيد بوفرورة محمد بن علي ملبو- ولاية بجاية »), à confirmer par l'ODEJ. |
| 46 | الشهيد بوهدو عبد الحميد | دار الشباب | Type déduit du nom de la page Facebook (« دار الشباب مسيسنة-ولاية بجاية »), à confirmer par l'ODEJ. |
| 48 | الشهيد تواتي اعمر | مخيم الشباب | Type déduit du nom de la page Facebook (« مخيم الشباب بني كسيلة - ولاية بجاية »), à confirmer par l'ODEJ. |
| 51 | الشهيد دهاملة مولود | مخيم الشباب | Type déduit du nom de la page Facebook (« مخيم الشباب ملبو-ولاية بجاية »), à confirmer par l'ODEJ. |
| 52 | الشهداء الإخوة سوماري بجاية | بيت الشباب | Type déduit du nom de la page Facebook (« بيت الشباب الاخوة سوماري- ولاية بجاية »), à confirmer par l'ODEJ. |
| 53 | الشهيد بوهراوة اعمر | بيت الشباب | Type déduit du nom de la page Facebook (« بيت الشباب سوق الاثنين بجاية »), à confirmer par l'ODEJ. |
| 54 | الشهيد مسعودي رابح خراطة | بيت الشباب | Type déduit du nom de la page Facebook (« بيت الشباب خراطة - ولاية بجاية »), à confirmer par l'ODEJ. |
| 55 | المجاهد المرحوم عبدون محند أميزور | دار الشباب | Type déduit du nom de la page Facebook (« دار الشباب أميزور-ولاية بجاية »), à confirmer par l'ODEJ. |
| 56 | مولود قاسم نايت بلقاسم | دار الشباب | Type déduit du nom de la page Facebook (« دار الشباب إغيل علي ولاية بجاية »), à confirmer par l'ODEJ. |
| 57 | بركاني مجيد صدوق | دار الشباب | Type déduit du nom de la page Facebook (« دار الشباب صدوق- ولاية بجاية »), à confirmer par l'ODEJ. |
| 60 | الشهيد معوش حاج لعمارة | دار الشباب | Type déduit du nom de la page Facebook (« دار الشباب الشهيد معوش حاج لعمارة أوزلاڤن - ولاية بجاية »), à confirmer par l'ODEJ. |
| 64 | الشهيد بوعيطة عبدالرحمان تاوريت إغيل | دار الشباب | Type déduit du nom de la page Facebook (« دار الشباب تاوريرت اغيل-ولاية بجاية »), à confirmer par l'ODEJ. |
| 65 | الشهيد قشي مجيد تيمزريت | دار الشباب | Type déduit du nom de la page Facebook (« دار الشباب تيمزريت - ولاية بجاية »), à confirmer par l'ODEJ. |
| 66 | الشهيد لطرش عبد الله البرزاخ ذرع القايد | دار الشباب | Type déduit du nom de la page Facebook (« دار الشباب البرزاخ - ولاية بجاية »), à confirmer par l'ODEJ. |
| 67 | الشهيد عيوز سليمان درقينة | بيت الشباب | Type déduit du nom de la page Facebook (« بيت الشباب درقينة-ولاية بجاية »), à confirmer par l'ODEJ. |

### Liens Facebook retirés (4)

| N° | Établissement | Remarque |
|---|---|---|
| 2 | بيت الشباب أدكار | Lien Facebook retiré : inaccessible ou page d'un autre établissement. |
| 14 | الشهداء عبادي سيدي عياد | Lien Facebook retiré : inaccessible ou page d'un autre établissement. |
| 37 | مركب رياضي جواري تمقرة | Lien Facebook retiré : inaccessible ou page d'un autre établissement. |
| 49 | الشهداء عصم الطيب وابنه حميمي تازمالت | Lien Facebook retiré : inaccessible ou page d'un autre établissement. |

### Notes de l'audit (28)

| N° | Établissement | Note |
|---|---|---|
| 2 | بيت الشباب أدكار | Link inaccessible on two independent checks |
| 4 | المركب الرياضي الجواري حامية محند الشريف بني معوش | Wrong Facebook category (music, health) |
| 5 | الشهيد أوغليس محند أكلي أميزور | Wrong Facebook category (restaurant) |
| 10 | الشهيد بوحيرد السعيد سوق الإثنين | Same coordinates as #32 |
| 11 | الشهداء آيت صالح بجاية | Listed as Aït Salah; page is the Ighil Ouazzoug sports complex. Confirm |
| 12 | الشهيد خالدي عبد القادر صنادلة | Wrong Facebook category (interior decoration) |
| 14 | الشهداء عبادي سيدي عياد | Link opens the Sidi Aïch youth centre, which is #15 |
| 16 | مولود فرعون القصر | Coordinates match #42 in Béjaïa city, not El Kseur · Has posts Facebook labels as AI content |
| 18 | دار الشباب تقريت | Wrong Facebook category (news site) |
| 24 | الشهيد بن تجي محند أكلي برباشة | Coordinates are far from Barbacha and from #22 |
| 27 | الشهيد بانون أكلي | Page is the Djebla multi-activity hall. Confirm it is this institution |
| 28 | الشهيد اسماعيل علي بن عيسى أوقاس | Has posts Facebook labels as AI content |
| 29 | الشهيد عيوز سليمان درقينة | Same listed name as #67, a different institution · Has posts Facebook labels as AI content |
| 30 | مركب رياضي جواري صدوق | Has posts Facebook labels as AI content |
| 32 | الشهيد عمارة عمار سوق الإثنين | Same coordinates as #10 |
| 37 | مركب رياضي جواري تمقرة | Link opens the Akfadou youth centre, which is #39 |
| 40 | الشهيد حريش محند أوقاس | No profile picture |
| 42 | الشهيدة فاطمة رمطاني بجاية | Same coordinates as #16 |
| 43 | دار الشباب فرعون | Has posts Facebook labels as AI content |
| 46 | الشهيد بوهدو عبد الحميد | Page says Messissna; coordinates sit beside Seddouk (#30, #57). Confirm |
| 48 | الشهيد تواتي اعمر | Page is the Beni Ksila youth camp. Confirm · Has posts Facebook labels as AI content |
| 49 | الشهداء عصم الطيب وابنه حميمي تازمالت | Link opens the Tazmalt youth centre, which is #33 |
| 51 | الشهيد دهاملة مولود | Page is the Melbou youth camp. Confirm |
| 52 | الشهداء الإخوة سوماري بجاية | No profile picture |
| 56 | مولود قاسم نايت بلقاسم | Page is the Ighil Ali youth centre. Confirm |
| 58 | قاعة متعددة الخدمات مسيسنة | 2 followers |
| 63 | دار الشباب لعلام | Has posts Facebook labels as AI content |
| 67 | الشهيد عيوز سليمان درقينة | Same listed name as #29, a different institution |

## Questions à poser à l'ODEJ

1. Le type des lignes 14, 49, et la confirmation des 41 types déduits des pages Facebook.
2. Les lignes aux coordonnées identiques (10, 16, 32, 42) : quelles sont les bonnes coordonnées ?
3. La page Facebook des lignes 2, 14, 37, 49, s'il y en a une.
4. Les lignes 29, 67 portent le même nom : l'audit indique deux établissements distincts, à confirmer.
5. La commune des lignes 27, 46, 48, 51, 53, 56, 60 et des lieux-dits (lignes 12, 18, 19, 26, 31, 38, 63).
6. Les graphies françaises officielles des noms (pour la version anglaise), le logo en vectoriel, et pour chaque établissement : photos, description, activités, horaires, téléphone.
