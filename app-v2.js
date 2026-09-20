/* ============================================================
   app-v2.js — a „Régi tengerész" felület összekötése a motorral
   A motor (flags.js, lobogas-webgl.js, zaszlo-app.js) VÁLTOZATLAN.
   ============================================================ */
const cA = document.getElementById("cvA");
const cAbetu = document.getElementById("cvAbetu");
const cB = document.getElementById("cvB");
const cBbetu = document.getElementById("cvBbetu");
const cC = document.getElementById("cvC");
const bevitel = document.getElementById("szo");
const hosszKi = document.getElementById("hossz");
const zaszloKi = document.getElementById("zaszlok");
const hibaKi = document.createElement("p");
hibaKi.className = "hiba";
hibaKi.style.display = "none";
document.getElementById("bemenetKartya").appendChild(hibaKi);

let betuk = [];
let kepek = {};
let mod = "A";
let t0 = performance.now();
let zaszloMag = 170;
let betuLatszik = false;
let betuLatszikB = true;

/* ---------- csúszka-építő ---------- */
function csuszkak(id, elemek) {
  const tar = document.getElementById(id);
  if (!tar) return;
  tar.innerHTML = "";
  elemek.forEach(function (e) {
    const d = document.createElement("div");
    d.className = "row";
    d.innerHTML = '<label>' + e.cim + ' <b id="' + id + '-' + e.kulcs + '-v"></b></label>' +
      '<input type="range" id="' + id + '-' + e.kulcs + '" min="' + e.min +
      '" max="' + e.max + '" value="' + e.ertek + '" step="' + (e.lep || 1) + '">';
    tar.appendChild(d);
    const s = d.querySelector("input");
    const v = d.querySelector("b");
    const fr = function () {
      const nyers = parseFloat(s.value);
      v.textContent = e.kepernyo(nyers);
      e.beall(nyers);
    };
    s.addEventListener("input", fr);
    fr();
  });
}

const KAT = { cim: "Amplitúdó", kulcs: "amp", min: 0, max: 25, ertek: 12, lep: 0.5,
  kepernyo: v => v.toFixed(1) + "%", beall: v => { LOB.amplitudo = v / 100; } };
const KHUL = { cim: "Hullámhossz", kulcs: "hul", min: 30, max: 250, ertek: 130,
  kepernyo: v => (v / 100).toFixed(2) + "×", beall: v => { LOB.hullamhossz = v / 100; } };
const KSEB = { cim: "Tempó", kulcs: "seb", min: 0, max: 300, ertek: 70,
  kepernyo: v => (v / 100).toFixed(2) + " /s", beall: v => { LOB.sebesseg = v / 100; } };
const KFOD = { cim: "Fodrozódás", kulcs: "fod", min: 0, max: 100, ertek: 30,
  kepernyo: v => (v / 100).toFixed(2), beall: v => { LOB.fodro = v / 100; } };
const KPER = { cim: "Mélység-torzítás", kulcs: "per", min: 0, max: 200, ertek: 100,
  kepernyo: v => (v / 100).toFixed(2), beall: v => { LOB.perspektiva = v / 100; } };
const KMER = { cim: "Zászlóméret", kulcs: "mer", min: 6, max: 100, ertek: 34,
  kepernyo: v => v + "%",
  beall: v => { zaszloMag = Math.round(170 * v / 34); meretez(); } };

function alapCsuszkak(id) { csuszkak(id, [KMER, KAT, KHUL, KSEB, KFOD, KPER]); }
alapCsuszkak("ctrlA2");
alapCsuszkak("ctrlB");

/* ---------- fordítás ---------- */
function frissit() {
  const nyers = bevitel.value;
  betuk = fordit(nyers, 40);
  hosszKi.textContent = betuk.length;
  zaszloKi.textContent = betuk.filter(zaszloE).length;
  meretez();
  hibaKi.style.display = "none";
  szoAzUrlben(nyers);
  if (mutato > betuk.length - 1) mutato = Math.max(0, betuk.length - 1);
  kepekBetolt(betuk, 1200).then(function (tar) {
    kepek = tar;
    pontEpit();
  }).catch(function (e) {
    hibaKi.style.display = "block";
    hibaKi.textContent = "Hiba a zászlók betöltésekor: " + e.message;
  });
  cC.width = parseInt(document.getElementById("vFelbontas").value.split("x")[0], 10);
  cC.height = parseInt(document.getElementById("vFelbontas").value.split("x")[1], 10);
}

/* ---------- vászon-méretezés (méret-csúszka) ----------
   A cél: a színpad MINDIG beférjen a rendelkezésre álló helybe,
   és a szöveg lehetőleg EGY sorban elférjen. Ezért a rendelkezésre
   álló magasságból visszafelé számolunk: mennyi fér egy sorba. */
function szinpadSzel() {
  const s = document.getElementById("stageA");
  return s && s.clientWidth ? Math.max(320, s.clientWidth - 4) : 1080;
}
/* a színpad maximális magassága: a nézetmagasság fele (asztalon), mobilon 44vh */
function szinpadMagassag() {
  const v = window.innerHeight;
  if (v < 760) return Math.max(180, Math.round(v * 0.34));
  if (v < 900) return Math.max(200, Math.round(v * 0.40));
  return Math.max(200, Math.round(v * 0.46));
}
function meretez() {
  const maxSzel = szinpadSzel();
  const maxMag = szinpadMagassag();
  /* ha egy sor sem fér ki a jelenlegi mérettel, csökkentjük a zászlót */
  const t = sorTordeles(betuk, maxSzel, { zaszloMag: zaszloMag });
  const sorokSzam = Math.max(1, t.sorok.length);
  const sorMagassag = zaszloMag + 55 + 85;
  let vegsoMag = zaszloMag;
  if (sorokSzam * sorMagassag > maxMag) {
    /* a zászlót addig csökkentjük, amíg vagy egy sorba nem fér,
       vagy el nem érjük a minimumot */
    const proba = Math.max(36, Math.floor(maxMag / sorokSzam) - 140);
    if (proba < vegsoMag) vegsoMag = proba;
  }
  const t2 = sorTordeles(betuk, maxSzel, { zaszloMag: vegsoMag });
  const sorok2 = Math.max(1, t2.sorok.length);
  let leghosszabb = 0;
  t2.sorok.forEach(function (s) { if (s.length > leghosszabb) leghosszabb = s.length; });
  const egyZ = vegsoMag * (FLAG_W / FLAG_H);
  const hezag2 = Math.round(egyZ * 0.07);
  cA.width = Math.max(320,
    t2.perem * 2 + leghosszabb * egyZ + Math.max(0, leghosszabb - 1) * hezag2);
  cA.height = Math.min(maxMag, sorok2 * (vegsoMag + 55 + 85));
  cA.dataset.vegsoMag = vegsoMag;
  if (cAbetu) { cAbetu.width = cA.width; cAbetu.height = cA.height; }
}

/* ---------- B) pontjelző ---------- */
let mutato = 0;
function pontEpit() {
  const tar = document.getElementById("pontok");
  tar.innerHTML = "";
  betuk.forEach(function (b, i) {
    const d = document.createElement("div");
    d.className = "pont" + (i === mutato ? " on" : (i < mutato ? " kesz" : ""));
    d.title = b === " " ? "szóköz" : b;
    tar.appendChild(d);
  });
}
function mutatoAllit(i) {
  mutato = Math.max(0, Math.min(betuk.length - 1, i));
  pontEpit();
}

/* ---------- A) sor ---------- */
let _glA = null;
function glA() {
  if (!_glA) _glA = cA.getContext("webgl", { alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: true });
  return _glA;
}
function rajzolA(t) {
  const gl = glA();
  if (!gl) return;
  gl.clearColor(0.10, 0.14, 0.19, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  const t2 = sorTordeles(betuk, szinpadSzel(), { zaszloMag: zaszloMag });
  /* a tényleges rajzolási méret (a meretez() esetleg csökkentette) */
  const rMag = parseInt(cA.dataset.vegsoMag || zaszloMag, 10);
  const t3 = sorTordeles(betuk, cA.width, { zaszloMag: rMag });
  let y = 55, x = t3.perem, sorIdx = 0, sorban = 0;
  const celok = [];
  betuk.forEach(function (betu, i) {
    if (sorban >= t3.sorok[sorIdx].length) {
      sorIdx++; x = t3.perem; y += rMag + 55 + 85; sorban = 0;
    }
    sorban++;
    const van = zaszloE(betu);
    if (van) {
      const kep = kepek[betu];
      if (kep) {
        const fazisElt = (i % 5) * 0.42;
        lobogoZaszloGL(cA, kep, Math.round(x), Math.round(y),
          t3.zaszloSz, rMag, t, { fazis: (LOB.fazis || 0) + fazisElt });
      }
    }
    celok.push({ x: Math.round(x + t3.zaszloSz / 2), y: Math.round(y + rMag),
                 s: betu, van: van });
    x += t3.zaszloSz + t3.hezag;
  });
  if (cAbetu.width !== cA.width || cAbetu.height !== cA.height) {
    cAbetu.width = cA.width;
    cAbetu.height = cA.height;
  }
  const ctx = cAbetu.getContext("2d");
  ctx.clearRect(0, 0, cAbetu.width, cAbetu.height);
  if (betuLatszik) {
    const fs = Math.max(22, Math.round(rMag * 0.52));
    ctx.font = "700 " + fs + "px 'Cinzel', Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(255,255,255,.94)";
    ctx.shadowColor = "rgba(0,0,0,.65)";
    ctx.shadowBlur = 10;
    celok.forEach(function (c) {
      if (!c.van) return;
      ctx.fillText(c.s, c.x, c.y + 12);
    });
    ctx.shadowBlur = 0;
  }
}

/* ---------- B) egy zászló ---------- */
let _glB = null;
function glB() {
  if (!_glB) _glB = cB.getContext("webgl", { alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: true });
  return _glB;
}
function rajzolB(t) {
  const gl = glB();
  if (!gl) return;
  gl.clearColor(0.10, 0.14, 0.19, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  const betu = betuk[mutato];
  if (!zaszloE(betu)) return;
  const kep = kepek[betu];
  if (!kep) return;
  const mag = Math.min(420, Math.round(zaszloMag * 2.0));
  const betuM = Math.round(mag * 0.95);
  const ossz = mag + betuM * 1.25;
  const felso = Math.max(24, Math.round((cB.height - ossz) / 2));
  const szel = Math.round(mag * (FLAG_W / FLAG_H));
  lobogoZaszloGL(cB, kep, Math.round((cB.width - szel) / 2),
    Math.round(felso), szel, mag, t);
  const betuKozep = felso + mag + betuM * 0.72;
  if (!cBbetu) return;
  if (cBbetu.width !== cB.width || cBbetu.height !== cB.height) {
    cBbetu.width = cB.width;
    cBbetu.height = cB.height;
  }
  const ctx = cBbetu.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, cBbetu.width, cBbetu.height);
    if (!betuLatszikB) return;
    ctx.font = "700 " + betuM + "px 'Cinzel', Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,.85)";
    ctx.shadowBlur = 26;
    ctx.fillText(betu, cBbetu.width / 2, betuKozep);
    ctx.shadowBlur = 0;
  }
}

/* ---------- C) videó-jelenet ---------- */
let cAllapot = { feny: false, hatter: "dark", hossz: 5.0, kezdet: 0 };
let _glC = null;
function glC() {
  if (!_glC) _glC = cC.getContext("webgl", { alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: true });
  return _glC;
}
function rajzolC(t) {
  const gl = glC();
  if (!gl) return;
  const vilagos = cAllapot.hatter === "light";
  if (vilagos) gl.clearColor(0.96, 0.96, 0.97, 1); else gl.clearColor(0.10, 0.14, 0.19, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  const n = betuk.length || 1;
  const hossz = cAllapot.hossz;
  const beuszas = hossz * 0.55 / n;
  const eltelt = t - cAllapot.kezdet;
  let latszo = Math.min(n, Math.floor(eltelt / beuszas) + 1);
  if (eltelt > hossz * 0.72) latszo = n;
  const latszoBetuk = betuk.slice(0, latszo);
  const t2 = sorTordeles(latszoBetuk, cC.width - 120, { zaszloMag: 170 });
  const y = Math.round((cC.height - 170) / 2 - 40);
  let x = Math.round((cC.width - (t2.darab * t2.zaszloSz + (t2.darab - 1) * t2.hezag)) / 2);
  latszoBetuk.forEach(function (betu, i) {
    if (!zaszloE(betu)) { x += t2.zaszloSz + t2.hezag; return; }
    const kep = kepek[betu];
    if (!kep) { x += t2.zaszloSz + t2.hezag; return; }
    const fazisElt = (i % 5) * 0.42;
    lobogoZaszloGL(cC, kep, Math.round(x), y, t2.zaszloSz, 170, t,
      { fazis: (LOB.fazis || 0) + fazisElt });
    x += t2.zaszloSz + t2.hezag;
  });
}

/* ---------- fő ciklus ---------- */
let kockak = 0, kockaIdo = performance.now();
function ciklus(most) {
  const t = (most - t0) / 1000;
  if (!Object.keys(kepek).length) { requestAnimationFrame(ciklus); return; }
  if (mod === "A") rajzolA(t);
  else if (mod === "B") rajzolB(t);
  else if (mod === "C") rajzolC(t);
  kockak++;
  if (most - kockaIdo > 500) {
    const f = Math.round(kockak * 1000 / (most - kockaIdo));
    const c = document.getElementById("fpsA");
    if (c) c.textContent = f + " fps";
    kockak = 0; kockaIdo = most;
  }
  requestAnimationFrame(ciklus);
}

/* ---------- fülek + mobil alsó navigáció ---------- */
function nezetValt(m) {
  mod = m;
  document.querySelectorAll("#fulek button").forEach(function (g) {
    g.classList.toggle("on", g.dataset.m === m);
  });
  ["A", "B", "C"].forEach(function (x) {
    const p = document.getElementById("p-" + x);
    if (p) p.classList.toggle("on", x === m);
  });
  document.querySelectorAll("#alsoSav button").forEach(function (g) {
    g.classList.toggle("on", g.dataset.nezet === m);
  });
  if (m === "C") cAllapot.kezdet = 0;
  meretez();
}
document.querySelectorAll("#fulek button").forEach(function (g) {
  g.onclick = function () { nezetValt(g.dataset.m); };
});
document.querySelectorAll("#alsoSav button").forEach(function (g) {
  g.onclick = function () {
    const n = g.dataset.nezet;
    if (n === "beall") {
      const o = document.getElementById("oldalKartya");
      o.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    nezetValt(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
});

/* ---------- bemenet ---------- */
bevitel.addEventListener("input", frissit);
document.getElementById("torles").onclick = function () {
  bevitel.value = ""; mutato = 0; frissit(); bevitel.focus();
};
window.addEventListener("resize", function () { meretez(); });

/* ---------- A) kapcsolók és exportok ---------- */
document.getElementById("betuGomb").onclick = function () {
  betuLatszik = !betuLatszik;
  this.classList.toggle("on", betuLatszik);
  this.textContent = betuLatszik ? "Betűk elrejtése" : "Betűk mutatása";
};
const bb = document.getElementById("betuGombB");
if (bb) {
  const bkEz = function () {
    bb.classList.toggle("on", betuLatszikB);
    bb.textContent = betuLatszikB ? "Betűk elrejtése" : "Betűk mutatása";
  };
  bkEz();
  bb.onclick = function () { betuLatszikB = !betuLatszikB; bkEz(); };
}
function exportKeszit() {
  return exportSor(betuk, kepek, cA.width, cA.height,
    (performance.now() - t0) / 1000, LOB, null, parseInt(cA.dataset.vegsoMag || zaszloMag, 10));
}
document.getElementById("pngA").onclick = function () {
  pngExport(cA, "zaszlosor-" + (bevitel.value.trim() || "szoveg") + ".png", false, exportKeszit());
};
document.getElementById("pngA2").onclick = function () {
  pngExport(cA, "zaszlosor-papir-" + (bevitel.value.trim() || "szoveg") + ".png", true, exportKeszit());
};
document.getElementById("pngA3").onclick = function () {
  pngExport(cA, "zaszlosor-" + (bevitel.value.trim() || "szoveg") + ".png", false, exportKeszit());
};
function linkMasol() {
  const u = szoAzUrlben(bevitel.value);
  const k = document.getElementById("linkInfo");
  navigator.clipboard.writeText(u).then(function () {
    k.textContent = "✓ link a vágólapon";
    setTimeout(function () { k.textContent = ""; }, 2200);
  }).catch(function () { k.textContent = u; });
}
document.getElementById("linkA").onclick = linkMasol;
document.getElementById("linkA2").onclick = linkMasol;

/* ---------- B) léptetés ---------- */
document.getElementById("elore").onclick = function () { mutatoAllit(mutato + 1); };
document.getElementById("vissza").onclick = function () { mutatoAllit(mutato - 1); };
document.addEventListener("keydown", function (e) {
  if (mod !== "B") return;
  if (e.key === "ArrowRight") mutatoAllit(mutato + 1);
  if (e.key === "ArrowLeft") mutatoAllit(mutato - 1);
});

let auto = null;
const sebessegek = [0.5, 1.0, 1.5, 2.0, 3.0];
let sebIdx = 2;
document.getElementById("sebGomb").onclick = function () {
  sebIdx = (sebIdx + 1) % sebessegek.length;
  this.textContent = sebessegek[sebIdx].toFixed(1) + " s";
  if (auto) { clearInterval(auto); autoIndit(); }
};
function autoIndit() {
  auto = setInterval(function () {
    if (mutato >= betuk.length - 1) { mutatoAllit(0); return; }
    mutatoAllit(mutato + 1);
  }, sebessegek[sebIdx] * 1000);
}
document.getElementById("autoGomb").onclick = function () {
  if (auto) {
    clearInterval(auto); auto = null;
    this.textContent = "Automatikus"; this.classList.remove("on");
  } else {
    autoIndit();
    this.textContent = "Megállítás"; this.classList.add("on");
  }
};

/* ---------- C) videó ---------- */
document.getElementById("vIdo").addEventListener("input", function () {
  document.getElementById("l-vido").textContent = (this.value / 10).toFixed(1) + " s";
});
document.getElementById("vFelbontas").onchange = function () {
  const p = this.value.split("x");
  cC.width = parseInt(p[0], 10); cC.height = parseInt(p[1], 10);
};
document.getElementById("vHatter").onchange = function () {
  cAllapot.hatter = this.value;
};

let felvetelObj = null, videoBlob = null;
document.getElementById("felvetel").onclick = function () {
  if (felvetelObj) return;
  const gomb = this;
  const all = document.getElementById("recAllapot");
  if (!Object.keys(kepek).length) { all.textContent = "Előbb írj be valamit."; return; }
  cAllapot.hatter = document.getElementById("vHatter").value;
  cAllapot.hossz = parseFloat(document.getElementById("vIdo").value) / 10;
  cAllapot.kezdet = (performance.now() - t0) / 1000;
  felvetelObj = videóIndit(cC);
  if (!felvetelObj) {
    all.textContent = "Ez a böngésző nem támogatja a videófelvételt.";
    felvetelObj = null; return;
  }
  gomb.disabled = true;
  gomb.textContent = "Felvétel…";
  all.textContent = "Felvétel folyamatban (" + cAllapot.hossz.toFixed(1) + " s) — ne zárd be az oldalt.";
  setTimeout(function () {
    felvetelObj.megall().then(function (blob) {
      videoBlob = blob;
      const letolt = document.getElementById("vLetolt");
      letolt.disabled = false;
      letolt.textContent = "Videó letöltése (" + (blob.size / 1024 / 1024).toFixed(1) + " MB)";
      all.textContent = "✓ Elkészült. Kattints a letöltésre.";
      gomb.disabled = false;
      gomb.textContent = "Felvétel indítása";
      felvetelObj = null;
    });
  }, (cAllapot.hossz + 0.4) * 1000);
};
document.getElementById("vLetolt").onclick = function () {
  if (videoBlob) fajlLetolt(videoBlob, "zaszlo-" + (bevitel.value.trim() || "szoveg") + ".webm");
};

/* ---------- indítás ---------- */
(function () {
  const q = szoAzUrlben();
  if (q) bevitel.value = q;
  if (!bevitel.value) bevitel.value = "BUDAHÁZY SZABOLCS";
  frissit();
  mutatoAllit(0);
  requestAnimationFrame(ciklus);
})();
