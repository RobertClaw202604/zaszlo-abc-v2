# Jelzőzászló-fordító — v2 „Régi tengerész"

Ugyanaz a működő motor, **teljesen új felület**. A v1 (sötét, modern)
érintetlen marad a `otletlada` repóban.

- **Élő:** https://robertclaw202604.github.io/zaszlo-abc-v2/
- **Repó:** https://github.com/RobertClaw202604/zaszlo-abc-v2

## Mi ez

Szöveg → nemzetközi hajózási jelzőzászlók, **lobogva**. Három nézet:

- **Sorban** — az összes zászló egymás mellett
- **Egymás után (egyesével)** — egyszerre egy zászló, léptetve, alatta a nagy betű
- **Videó** — animált WebM letöltés

Emellett PNG-export (tenger / papír háttér) és megosztható link.

## Stílus

Meleg papír, rézkarc, klasszikus serif (Cinzel + EB Garamond),
sötétkék-vörös-arany színvilág. Dupla vonal-keret, enyhe papír-erezett.

## Felépítés

| Fájl | Szerep |
|---|---|
| `index.html` | a felület szerkezete |
| `style.css` | a „Régi tengerész" stílus + mobil nézet |
| `app-v2.js` | a motor összekötése a felülettel |
| `flags.js` | a 36 jelzőzászló (SVG → kép) — **változatlan** |
| `lobogas-webgl.js` | a WebGL-lobogtató motor — **változatlan** |
| `zaszlo-app.js` | fordítás, tördelés, export — **változatlan** |
| `sw.js` + `manifest.webmanifest` | PWA (telepíthető, offline) |

## Egy laptop képernyőre

A v2 fő célja: **görgetés nélkül** elférjen. Ezért:

- a színpad magassága a nézetmagassághoz kötött (`szinpadMagassag()`)
- ha a szöveg nem fér ki, a zászlóméret **automatikusan csökken**
  (`meretez()` visszafelé számol a rendelkezésre álló magasságból)
- asztalon két hasáb (bemenet + színpad | beállítások), mobilon egy hasáb

## Mobil: PWA / natív app érzet

- **alsó navigációs sáv** 4 ikonnal (Sorban / Egymás után / Videó / Beállítások)
- nagy, kerek, érintésbarát vezérlők
- lekerekített kártyák, puha árnyékok
- telepíthető a kezdőképernyőre (manifest + service worker)

## Tesztek

- `_v2test.js` — **16/16** (fordítás, nézetek, betű-kapcsoló, PNG-export, link, mobil sáv)

## Fejlesztés

```bash
python3 -m http.server 8911
# http://localhost:8911/index.html
node _v2test.js
```
