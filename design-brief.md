# Hajózási zászló-ábécé fordító — v2 design-brief

**Dátum:** 2026-09-20
**Cél:** vizuális terv (3 variáció) egy **újragondolt** web + mobil felülethez
**Alap:** a kész v1 működik (A/B/C mód, méret-csúszka, betű-kijelző)

---

## 1. Mi ez a termék

Egy webes eszköz, amely **bármilyen szöveget nemzetközi hajózási
jelzőzászlókra fordít**, és a zászlókat **lobogva** mutatja meg. Három nézet:

- **A) Sorban** — az összes zászló egymás mellett, egy sorban (vagy tördelve)
- **B) Egyesével** — egyszerre egy zászló, léptetve (mint ahogy a jelet egyszerre olvassák)
- **C) Videó** — a zászlósor animált videóként letölthető (WebM)

Emellett: **PNG export** (sötét + fehér háttérrel), **megosztható link**
(a szó az URL-ben).

## 2. Kik használják

- **Hajósok / vitorlázók** — jelzés-üzenet összeállítása
- **Oktatók** — a zászló-ábécé tanítása
- **Ajándék / szórakozás** — valaki nevének vagy egy szónak a „zászlósítása"
- **Marketing / social** — látványos megosztható kép

## 3. A v2 célja (miért kell új terv)

- **Férjen rá egy laptop képernyőre** — jelenleg az A mód hosszú szövegnél
  lecsúszik; a v2-ben minden fontos elem **egy képkivágásban** legyen
- **Nagyon szép legyen** — a jelenlegi funkcionális, de „fejlesztői" kinézetű
- **PWA-szerű, mobil-app-szerű mobil változat** — telepíthető, natív app
  érzet, alsó navigáció, nagy érintőfelületek

## 4. Amit a terv MUTASSON (3 variáció)

Mindhárom terv ugyanazt a tartalmat mutassa, csak **más hangulatban**:

### Kép 1 — Asztali (desktop) web, 16:9, laptop képernyőre
- Fejléc: cím + rövid leírás
- **Szövegbeviteli mező** felül, jól láthatóan (pl. „ARWORKS" vagy „SOS")
- **Három nézet-választó** (Sorban / Egyesével / Videó) — fülek vagy szegmentált vezérlő
- **A zászlósor** — 8-12 jelzőzászló egymás mellett, **lobogva** (hullámos,
  fény-árnyékos, valósághű textúra)
- A zászlók alatt **a betűk** (opcionális megjelenítés)
- **Méret-csúszka** és 2-3 további vezérlő
- **Letöltés / megosztás** gombok
- A teljes felület **egy képernyőn**, görgetés nélkül

### Kép 2 — Mobil, PWA / natív app érzet, 9:16 (telefon-álló)
- **Alul navigáció** (3-4 ikon: Zászlók / Videó / Beállítások / Info)
- **Nagy, kerek, érintésbarát vezérlők**
- A zászló(k) **nagy felületen**, középen, lobogva
- Nagy, jól olvasható **betű-kijelző**
- „Telepítés a kezdőképernyőre" sáv
- Lekerekített kártyák, puha árnyékok, lebegő gomb

### Kép 3 — Részlet / állapot (bármelyik)
- Pl. a **B) mód** közelije: egy zászló lobogva, alatta a nagy betű
- Vagy a **C) videó** előkészítő képernyője
- Vagy egy **sötét/világos téma** összehasonlítás

## 5. Stílusirányok a 3 variációhoz

### Variáció 1 — „Tengeri műszer" (Marine Instrument)
- **Sötét, mélykék-fekete háttér**, mint egy hajóhíd éjszaka
- **Neon-cián és narancs** kiemelések, finom rácsvonalak
- Üvegszerű (glassmorphism) kártyák, éles tipográfia
- Érzet: **precíz, technikai, professzionális**

### Variáció 2 — „Régi tengerész" (Vintage Maritime)
- **Meleg papír-szín / sárgás háttér**, régi térkép textúra
- **Sötétkék, vörös, arany** színek, rézkarc-érzés
- Klasszikus serif tipográfia, finom keretdíszek
- Érzet: **meleg, történelmi, kézműves**

### Variáció 3 — „Modern világos" (Clean Modern)
- **Világos, levegős háttér** (fehér / nagyon halvány szürke)
- **Élénk tengerkék + korall narancs** akcentus
- Nagy, kerek formák, sok fehér tér, puha árnyékok
- Érzet: **friss, barátságos, könnyed** — leginkább mobil-app-szerű

## 6. Kötelező vizuális elemek minden tervben

- **Valósághű jelzőzászlók** — nem absztrakt színes négyzetek, hanem
  felismerhető mintázatú zászlók (pl. A = fehér-kék, B = piros-fehér,
  O = sárga-piros átlós, stb.), enyhén hullámos, lobogó formában
- A zászlóknak **anyag-érzetük** van: redők, árnyék, fény
- **A betűk láthatók** a zászlók alatt (a v1 funkciója)
- Az **ARworks narancs (#FF5100)** megjelenhet akcentusként

## 7. Amit kerüljünk

- Zsúfoltság — a terv legyen **levegős**, a lényeg emelkedjen ki
- Túl sok szín — max 3-4 fő szín
- Ne legyen „sablonos" bootstrap-kinézet
- Ne legyen olyan elem, ami nem fér rá egy laptop képernyőre

## 8. Formátum

- **3 külön kép**, egyenként egy terv-variáció (asztali + mobil együtt)
- Vagy 3 kép = 3 variáció, és mindegyiken látszik a desktop ÉS a mobil nézet
- Arány: **16:9** (asztali) és **9:16** (mobil) — ha egy képen, akkor
  egymás mellett, mint egy prezentációs tábla

---

*A terv a meglévő, működő v1 funkcionalitását ábrázolja — a tartalom valós,
csak a megjelenés új.*
