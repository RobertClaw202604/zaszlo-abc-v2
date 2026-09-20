/* flags.js — a zászlórajzok (SVG stringként)
   minden zászló 60x40 (2:3 arány), hogy könnyű legyen méretezni */

const FLAG_W = 60, FLAG_H = 40;

/* ---- rajzoló segédfüggvények ---- */
function tegla(x, y, w, h, szin) {
  return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + szin + '"/>';
}
function haromszog(px, py, qx, qy, rx, ry, szin) {
  return '<polygon points="' + px + ',' + py + ' ' + qx + ',' + qy + ' ' + rx + ',' + ry +
    '" fill="' + szin + '"/>';
}
function kor(cx, cy, r, szin) {
  return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + szin + '"/>';
}

/* ---- betűkészlet: A–Z, 0–9 (nemzetközi jelzőzászlók) ---- */
const BETUK = [
  /* A — fehér-kék, függőleges csíkok + fehér csúcsú kék háromszög */
  ["A", tegla(0, 0, 60, 40, "#ffffff") +
        tegla(15, 0, 15, 40, "#003399") + tegla(45, 0, 15, 40, "#003399") +
        haromszog(0, 0, 30, 20, 0, 40, "#003399")],

  /* B — piros, függőleges, kifelé szélesedő csíkok */
  ["B", tegla(0, 0, 60, 40, "#ffffff") +
        haromszog(0, 0, 20, 20, 0, 40, "#cc0000") +
        haromszog(60, 0, 40, 20, 60, 40, "#cc0000") +
        tegla(20, 0, 20, 40, "#cc0000")],

  /* C — kék-fehér-piros-fehér-kék vízszintes sávok */
  ["C", tegla(0, 0, 60, 8, "#003399") + tegla(0, 8, 60, 8, "#ffffff") +
        tegla(0, 16, 60, 8, "#cc0000") + tegla(0, 24, 60, 8, "#ffffff") +
        tegla(0, 32, 60, 8, "#003399")],

  /* D — sárga-kék, függőleges (sárga közép) */
  ["D", tegla(0, 0, 60, 40, "#003399") + tegla(20, 0, 20, 40, "#ffcc00")],

  /* E — kék-fehér, vízszintes felül kék */
  ["E", tegla(0, 0, 60, 40, "#ffffff") + tegla(0, 0, 60, 20, "#cc0000")],

  /* F — fehér-piros, középen fehér rombusz */
  ["F", tegla(0, 0, 60, 40, "#ffffff") +
        haromszog(0, 0, 30, 20, 0, 40, "#cc0000") +
        haromszog(60, 0, 30, 20, 60, 40, "#cc0000") +
        haromszog(30, 0, 60, 20, 30, 40, "#cc0000") +
        haromszog(30, 0, 0, 20, 30, 40, "#cc0000")],

  /* G — sárga-kék, függőlegesen csíkos (6 sáv) */
  ["G", "".concat(
        tegla(0, 0, 10, 40, "#ffcc00"), tegla(10, 0, 10, 40, "#003399"),
        tegla(20, 0, 10, 40, "#ffcc00"), tegla(30, 0, 10, 40, "#003399"),
        tegla(40, 0, 10, 40, "#ffcc00"), tegla(50, 0, 10, 40, "#003399"))],

  /* H — fehér-kék, függőlegesen kettéosztva */
  ["H", tegla(0, 0, 30, 40, "#ffffff") + tegla(30, 0, 30, 40, "#cc0000")],

  /* I — sárga, középen fekete korong */
  ["I", tegla(0, 0, 60, 40, "#ffcc00") + kor(30, 20, 9, "#111111")],

  /* J — kék-fehér-kék vízszintes sávok */
  ["J", tegla(0, 0, 60, 40, "#ffffff") + tegla(0, 0, 60, 13, "#003399") +
        tegla(0, 27, 60, 13, "#003399")],

  /* K — sárga-kék, függőlegesen kettéosztva */
  ["K", tegla(0, 0, 30, 40, "#ffcc00") + tegla(30, 0, 30, 40, "#003399")],

  /* L — sárga-fekete, négyzettáblás (2x2) */
  ["L", tegla(0, 0, 30, 20, "#ffcc00") + tegla(30, 0, 30, 20, "#111111") +
        tegla(0, 20, 30, 20, "#111111") + tegla(30, 20, 30, 20, "#ffcc00")],

  /* M — kék, középen fehér X (kereszt) */
  ["M", tegla(0, 0, 60, 40, "#003399") +
        haromszog(0, 0, 30, 20, 60, 0, "#ffffff") +
        haromszog(0, 40, 30, 20, 60, 40, "#ffffff")],

  /* N — sakktáblás kék-fehér, 4x4 */
  ["N", (function () {
    let s = "";
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        if ((r + c) % 2 === 0)
          s += tegla(c * 15, r * 10, 15, 10, "#003399");
    return tegla(0, 0, 60, 40, "#ffffff") + s;
  })()],

  /* O — sárga-piros, átlósan kettéosztva */
  ["O", tegla(0, 0, 60, 40, "#ffcc00") +
        haromszog(60, 0, 60, 40, 0, 40, "#cc0000")],

  /* P — kék, középen fehér négyzet */
  ["P", tegla(0, 0, 60, 40, "#003399") + tegla(20, 10, 20, 20, "#ffffff")],

  /* Q — sárga, négyzet alakú */
  ["Q", tegla(0, 0, 60, 40, "#ffcc00")],

  /* R — piros, középen sárga kereszt */
  ["R", tegla(0, 0, 60, 40, "#cc0000") +
        tegla(25, 0, 10, 40, "#ffcc00") + tegla(0, 15, 60, 10, "#ffcc00")],

  /* S — fehér, középen kék négyzet */
  ["S", tegla(0, 0, 60, 40, "#ffffff") + tegla(20, 10, 20, 20, "#003399")],

  /* T — piros-fehér-kék, függőleges sávok */
  ["T", tegla(0, 0, 20, 40, "#cc0000") + tegla(20, 0, 20, 40, "#ffffff") +
        tegla(40, 0, 20, 40, "#003399")],

  /* U — piros-fehér, négyzettáblás */
  ["U", tegla(0, 0, 30, 20, "#cc0000") + tegla(30, 0, 30, 20, "#ffffff") +
        tegla(0, 20, 30, 20, "#ffffff") + tegla(30, 20, 30, 20, "#cc0000")],

  /* V — fehér, középen piros X */
  ["V", tegla(0, 0, 60, 40, "#ffffff") +
        haromszog(0, 0, 30, 20, 0, 40, "#cc0000") +
        haromszog(60, 0, 30, 20, 60, 40, "#cc0000")],

  /* W — kék, középen fehér négyzet, benne piros négyzet */
  ["W", tegla(0, 0, 60, 40, "#003399") + tegla(13, 8, 34, 24, "#ffffff") +
        tegla(22, 13, 16, 14, "#cc0000")],

  /* X — fehér, középen kék kereszt */
  ["X", tegla(0, 0, 60, 40, "#ffffff") +
        tegla(25, 0, 10, 40, "#003399") + tegla(0, 15, 60, 10, "#003399")],

  /* Y — sárga-piros, átlós csíkok */
  ["Y", tegla(0, 0, 60, 40, "#ffcc00") +
        haromszog(0, 0, 30, 20, 0, 40, "#cc0000") +
        haromszog(60, 0, 30, 20, 60, 40, "#cc0000") +
        tegla(0, 0, 60, 40, "none")],

  /* Z — fehér, négy háromszög (fekete-kék-piros-sárga) */
  ["Z", tegla(0, 0, 60, 40, "#ffffff") +
        haromszog(0, 0, 30, 20, 0, 40, "#111111") +
        haromszog(60, 0, 30, 20, 60, 40, "#003399") +
        haromszog(0, 0, 60, 0, 30, 20, "#cc0000") +
        haromszog(0, 40, 60, 40, 30, 20, "#ffcc00")],

  /* ---- számjegyek ---- */
  /* 0 — fehér-sárga-piros, függőleges sávok */
  ["0", tegla(0, 0, 20, 40, "#ffcc00") + tegla(20, 0, 20, 40, "#ffffff") +
        tegla(40, 0, 20, 40, "#cc0000")],

  /* 1 — fehér, középen piros korong */
  ["1", tegla(0, 0, 60, 40, "#ffffff") + kor(30, 20, 9, "#cc0000")],

  /* 2 — kék, fehér-piros-fehér függőleges sáv (középen) */
  ["2", tegla(0, 0, 60, 40, "#003399") + tegla(17, 0, 9, 40, "#ffffff") +
        tegla(26, 0, 17, 40, "#cc0000") + tegla(43, 0, 9, 40, "#ffffff")],

  /* 3 — fehér-kék-piros, függőleges sávok (egyenlő) */
  ["3", tegla(0, 0, 60, 40, "#ffffff") + tegla(24, 0, 12, 40, "#003399") +
        tegla(40, 0, 20, 40, "#cc0000")],

  /* 4 — fehér, piros kereszt (X) */
  ["4", tegla(0, 0, 60, 40, "#ffffff") +
        haromszog(0, 0, 30, 20, 60, 0, "#cc0000")],

  /* 5 — sárga-fekete, függőleges sávok */
  ["5", tegla(0, 0, 60, 40, "#ffcc00") + tegla(30, 0, 30, 40, "#111111")],

  /* 6 — fekete-fehér, négyzettáblás */
  ["6", tegla(0, 0, 30, 20, "#111111") + tegla(30, 0, 30, 20, "#ffffff") +
        tegla(0, 20, 30, 20, "#ffffff") + tegla(30, 20, 30, 20, "#111111")],

  /* 7 — sárga-kék, függőleges sávok */
  ["7", tegla(0, 0, 30, 40, "#ffcc00") + tegla(30, 0, 30, 40, "#003399")],

  /* 8 — fehér, középen piros négyzet */
  ["8", tegla(0, 0, 60, 40, "#ffffff") + tegla(20, 10, 20, 20, "#cc0000")],

  /* 9 — fehér-kék-sárga, függőleges sávok */
  ["9", tegla(0, 0, 20, 40, "#003399") + tegla(20, 0, 20, 40, "#ffcc00") +
        tegla(40, 0, 20, 40, "#ffffff")]
];

/* ---- a teljes zászlókészlet ---- */
const ZASZLOK = {};
BETUK.forEach(function (p) { ZASZLOK[p[0]] = p[1]; });

/* üres / ismeretlen helyőrző */
ZASZLOK[" "] = '<rect x="0" y="0" width="' + FLAG_W + '" height="' + FLAG_H +
  '" fill="none"/>';
ZASZLOK["?"] = tegla(0, 0, 60, 40, "#888888");

/* a zászló SVG-jének összeállítása adott méretben */
function flagSvg(betu, szelesseg) {
  const mag = szelesseg * (FLAG_H / FLAG_W);
  const belso = ZASZLOK[betu] || ZASZLOK["?"];
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + szelesseg +
    '" height="' + mag + '" viewBox="0 0 ' + FLAG_W + ' ' + FLAG_H + '">' +
    belso + '</svg>';
}

/* adat-URI (képként betöltéshez) */
function flagDataUri(betu, szelesseg) {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(flagSvg(betu, szelesseg));
}
