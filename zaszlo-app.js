/* ============================================================
   zaszlo-app.js — a Hajózási zászló-ábécé fordító logikája

   A lobogást a lobogas-webgl.js WebGL-motorja adja.
   Ez a fájl három dolgot tesz:
     1) fordít: szöveg -> zászló-azonosítók (ékezet nélkül, nagybetűvel)
     2) kirajzol: A) sorban, B) egyesével, C) videó
     3) exportál: PNG (zászlósor), videó (WebM)

   Nincs külső függőség, nincs szerver.
   ============================================================ */

/* ---- 1. Fordítás ---- */

/* az ékezetek és a speciális magyar betűk egyszerűsítése */
const EKEZET = {
  "Á": "A", "À": "A", "Â": "A", "Ä": "A", "Ã": "A",
  "É": "E", "È": "E", "Ê": "E", "Ë": "E",
  "Í": "I", "Ì": "I", "Î": "I", "Ï": "I",
  "Ó": "O", "Ò": "O", "Ô": "O", "Ö": "O", "Õ": "O", "Ő": "O",
  "Ú": "U", "Ù": "U", "Û": "U", "Ü": "U", "Ű": "U",
  "Ý": "Y", "Ÿ": "Y",
  "Ç": "C", "Ñ": "N", "Š": "S", "Ž": "Z", "ß": "S"
};

/* milyen karakterek fordíthatók le */
const ERVENYES = /[A-Z0-9 ]/;

/* a szöveg átalakítása zászló-azonosítók sorozatává */
function fordit(szoveg, maxHossz) {
  const hatar = maxHossz || 40;
  let tiszta = "";
  for (const ch of String(szoveg || "").toUpperCase()) {
    if (EKEZET[ch]) { tiszta += EKEZET[ch]; continue; }
    if (ERVENYES.test(ch)) { tiszta += ch; continue; }
    /* ismeretlen karakter: helykitöltő, hogy látszódjon, hogy volt ott valami */
    tiszta += "?";
  }
  return tiszta.slice(0, hatar).split("");
}

/* a szóközöket üres hézagként jelenítjük meg (nem zászló) */
function zaszloE(betu) {
  return betu !== " ";
}

/* ---- 2. A jelenet méretei (közös minden módhoz) ----
   A zászlók 2:3 arányúak. Egy sorban N zászló + a köztük lévő hézag. */
function sorMeret(n, opciok) {
  const o = opciok || {};
  const zaszloMag = o.zaszloMag || 170;              /* egy zászló magassága pixelben */
  const zaszloSz = zaszloMag * (FLAG_W / FLAG_H);    /* 1.5× a magasság */
  const hezag = o.hezag !== undefined ? o.hezag : Math.round(zaszloSz * 0.07);
  const szel = n * zaszloSz + Math.max(0, n - 1) * hezag + 2 * (o.perem || 48);
  const mag = zaszloMag + 2 * (o.peremFuggo || 70);
  return { zaszloMag: zaszloMag, zaszloSz: zaszloSz, hezag: hezag,
           szel: Math.round(szel), mag: Math.round(mag),
           perem: o.perem || 48, peremFuggo: o.peremFuggo || 70 };
}

/* hány zászló fér el egy sorban a maximális szélességen belül */
function sorTordeles(betuk, maxSzel, opciok) {
  const o = opciok || {};
  const zaszloMag = o.zaszloMag || 170;
  const zaszloSz = zaszloMag * (FLAG_W / FLAG_H);
  const hezag = o.hezag !== undefined ? o.hezag : Math.round(zaszloSz * 0.07);
  const perem = o.perem || 48;
  const hasznos = maxSzel - 2 * perem;
  const egy = zaszloSz + hezag;
  const darab = Math.max(1, Math.floor((hasznos + hezag) / egy));
  const sorok = [];
  for (let i = 0; i < betuk.length; i += darab) sorok.push(betuk.slice(i, i + darab));
  return { sorok: sorok, darab: darab, zaszloMag: zaszloMag, zaszloSz: zaszloSz,
           hezag: hezag, perem: perem };
}

/* ---- 3. A zászló-képek előzetes betöltése ---- */
function kepekBetolt(betuk, szelesseg) {
  const egyedi = Array.from(new Set(betuk.filter(zaszloE)));
  return Promise.all(egyedi.map(function (b) {
    return zaszloBetolt(b, szelesseg).then(function (img) { return [b, img]; });
  })).then(function (parok) {
    const tar = {};
    parok.forEach(function (p) { tar[p[0]] = p[1]; });
    return tar;
  });
}

/* ---- 4. Rajzolás: A) egy sorban, egymás mellett ----
   Minden zászló a saját helyén lobog. A fázisuk kissé eltér,
   hogy ne tűnjön mechanikusnak. */
function rajzolSor(canvas, kepek, betuk, t, beall) {
  const b = beall || {};
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: true });
  if (!gl) return false;

  gl.clearColor(0.10, 0.14, 0.19, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const m = sorMeret(betuk.length, b);
  let x = m.perem;
  const y = m.peremFuggo;

  betuk.forEach(function (betu, i) {
    if (!zaszloE(betu)) { x += m.zaszloSz + m.hezag; return; }
    const kep = kepek[betu];
    if (!kep) { x += m.zaszloSz + m.hezag; return; }
    /* minden zászló kissé más fázissal lobog */
    const fazisElt = (i % 5) * 0.42;
    lobogoZaszloGL(canvas, kep, Math.round(x), Math.round(y),
      m.zaszloSz, m.zaszloMag, t,
      Object.assign({}, b, { fazis: (b.fazis || 0) + fazisElt }));
    x += m.zaszloSz + m.hezag;
  });
  return true;
}

/* ---- 5. Rajzolás: B) egyesével, egymás után ----
   Egyszerre csak egy zászló látszik, nagyban, középen. */
function rajzolEgy(canvas, kep, t, beall) {
  const b = beall || {};
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: true });
  if (!gl) return false;
  gl.clearColor(0.10, 0.14, 0.19, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const mag = b.zaszloMag || Math.round(canvas.height * 0.62);
  const szel = Math.round(mag * (FLAG_W / FLAG_H));
  const x = Math.round((canvas.width - szel) / 2);
  const y = Math.round((canvas.height - mag) / 2);
  if (!kep) return true;
  lobogoZaszloGL(canvas, kep, x, y, szel, mag, t, b);
  return true;
}

/* ---- 6. Rajzolás: a teljes szó egy sorban, egy adott szélességen ---- */
function rajzolTeljesSor(canvas, kepek, betuk, t, beall) {
  const b = beall || {};
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: true });
  if (!gl) return false;
  gl.clearColor(0.10, 0.14, 0.19, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const m = sorMeret(betuk.length, b);
  let x = m.perem;
  const y = m.peremFuggo;
  betuk.forEach(function (betu, i) {
    if (!zaszloE(betu)) { x += m.zaszloSz + m.hezag; return; }
    const kep = kepek[betu];
    if (!kep) { x += m.zaszloSz + m.hezag; return; }
    const fazisElt = (i % 5) * 0.42;
    lobogoZaszloGL(canvas, kep, Math.round(x), Math.round(y),
      m.zaszloSz, m.zaszloMag, t,
      Object.assign({}, b, { fazis: (b.fazis || 0) + fazisElt }));
    x += m.zaszloSz + m.hezag;
  });
  return true;
}

/* ---- 7. PNG-export ----
   A megjelenített WebGL-vászonról a kép visszaolvasása (preserveDrawingBuffer
   nélkül) üres lenne, ezért az exporthoz KÜLÖN renderelünk egy 2D-s másolatra
   ugyanazzal a motorral (exportSor). */
let _mento = null;
function kepMentes(canvas) {
  if (!_mento) _mento = document.createElement("canvas");
  if (_mento.width !== canvas.width || _mento.height !== canvas.height) {
    _mento.width = canvas.width;
    _mento.height = canvas.height;
  }
  const ctx = _mento.getContext("2d");
  ctx.clearRect(0, 0, _mento.width, _mento.height);
  ctx.drawImage(canvas, 0, 0);
  return _mento;
}

/* ---- 7b. Export-render ----
   A megjelenített WebGL-vásznak preserveDrawingBuffer: true van, így
   a kirajzolt kép visszaolvasható. Az exporthoz UGYANAZT a vásznat
   használjuk: kirajzoljuk a friss képet, majd másoljuk. */
function exportSor(betuk, kepek, szelesseg, magassag, ido, beall, canvas, zaszloMag) {
  const cv = canvas || cA;
  const mag = zaszloMag || 170;
  const gl = cv.getContext("webgl", { alpha: true, premultipliedAlpha: false,
                                      preserveDrawingBuffer: true });
  if (!gl) return null;
  gl.clearColor(0.10, 0.14, 0.19, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  const t2 = sorTordeles(betuk, cv.width, { zaszloMag: mag });
  let y = 55, x = t2.perem, sorIdx = 0, sorban = 0;
  betuk.forEach(function (betu, i) {
    if (sorIdx < t2.sorok.length && sorban >= t2.sorok[sorIdx].length) {
      sorIdx++; x = t2.perem; y += mag + 55 + 85; sorban = 0;
    }
    sorban++;
    if (!zaszloE(betu)) { x += t2.zaszloSz + t2.hezag; return; }
    const kep = kepek[betu];
    if (!kep) { x += t2.zaszloSz + t2.hezag; return; }
    lobogoZaszloGL(cv, kep, Math.round(x), Math.round(y),
      t2.zaszloSz, mag, ido,
      Object.assign({}, beall, { fazis: ((beall && beall.fazis) || 0) + (i % 5) * 0.42 }));
    x += t2.zaszloSz + t2.hezag;
  });
  gl.finish();
  return kepMentes(cv);
}

function pngExport(canvas, fajlnev, feherHatter, forrasKep) {
  return new Promise(function (res) {
    /* ha kaptunk kész export-rendert, azt használjuk */
    const forras = forrasKep || kepMentes(canvas);
    let cel = forras;
    if (feherHatter) {
      cel = document.createElement("canvas");
      cel.width = forras.width; cel.height = forras.height;
      const c = cel.getContext("2d");
      c.fillStyle = "#ffffff";
      c.fillRect(0, 0, cel.width, cel.height);
      c.drawImage(forras, 0, 0);
    }
    cel.toBlob(function (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fajlnev || "zaszlosor.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      res(true);
    }, "image/png");
  });
}

/* ---- 8. Videó: a canvas rögzítése WebM-be ---- */
function videóIndit(canvas) {
  if (typeof MediaRecorder === "undefined") return null;
  const tipusok = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  let mt = null;
  for (const tp of tipusok) { if (MediaRecorder.isTypeSupported(tp)) { mt = tp; break; } }
  if (!mt) return null;

  let stream;
  try { stream = canvas.captureStream(60); } catch (e) { return null; }
  const rec = new MediaRecorder(stream, { mimeType: mt, videoBitsPerSecond: 12000000 });
  const darabok = [];
  rec.ondataavailable = function (e) { if (e.data && e.data.size) darabok.push(e.data); };
  rec.start(200);
  return {
    mime: mt,
    megall: function () {
      return new Promise(function (res) {
        rec.onstop = function () {
          res(new Blob(darabok, { type: mt }));
        };
        rec.stop();
      });
    }
  };
}

function fajlLetolt(blob, fajlnev) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fajlnev || "zaszlo-video.webm";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 6000);
}

/* ---- 9. Megosztható link: a szó az URL-ben ---- */
function szoAzUrlben(szo) {
  try {
    const p = new URLSearchParams(location.search);
    if (szo === undefined) return p.get("szo") || "";
    if (szo) p.set("szo", szo); else p.delete("szo");
    const u = location.origin + location.pathname +
      (p.toString() ? "?" + p.toString() : "");
    history.replaceState(null, "", u);
    return u;
  } catch (e) { return ""; }
}
