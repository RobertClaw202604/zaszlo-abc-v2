/* ============================================================
   lobogas-webgl.js — a zászló lobogtatása WebGL-lel

   MIÉRT WEBGL:
   A canvas 2D-s pixel-deformáció JavaScriptben fut, ezért a 2 megapixeles
   vásznon kockánként ~180 ms kellett -> 5 fps. Akadozott.

   WebGL-ben a számítás a videokártyán fut, és minden pixel a SAJÁT
   textúra-koordinátáját számolja ki a fragment-shaderben. Ugyanaz a
   deformáció, de teljes felbontáson, 60 fps-en, kompromisszum nélkül.

   A képlet ugyanaz, mint a 2D-s változatban:
     eltolás(x,t) = A·[sin(2πx/λ − ωt) + fodro·sin(2.3·2πx/λ − 2.1ωt)]
                    · csillapítás(x)
   ============================================================ */

const LOB = {
  amplitudo: 0.12,
  hullamhossz: 1.3,
  sebesseg: 0.7,
  csillapitas: 0.9,
  fodro: 0.3,
  feny: true,
  fazis: 0,
  vetules: 0.16,
  perspektiva: true
};

/* a csúcs-shader: egyetlen, a teljes vásznat lefedő négyszög */
const CS_CS = `
attribute vec2 poz;
varying vec2 uv;
void main() {
  uv = vec2((poz.x + 1.0) * 0.5, 1.0 - (poz.y + 1.0) * 0.5);
  gl_Position = vec4(poz, 0.0, 1.0);
}`;

/* a fragment-shader: minden pixel kiszámolja a forrás-helyét */
const CS_FS = `
precision highp float;
varying vec2 uv;
uniform sampler2D zaszlo;
uniform float ido;
uniform float amplitudo;
uniform float hullamhossz;
uniform float sebesseg;
uniform float csillapitas;
uniform float fodro;
uniform float vetules;
uniform float feny;
uniform float fazis;
uniform vec2 terulet;      /* a zászló mérete a vásznon (w, h) */
uniform float arany;       /* a vásznon a zászló helye és mérete */
uniform float perspektiva; /* 0 = sík zászló, 1 = külső forma is torzul,
                              1-nél nagyobb = erősebb mélység-torzítás */

/* a hullám kiszámítása egy x01 pontban */
vec3 hullam(float x01, float t) {
  float w = 6.28318530718 * sebesseg;
  float k = 6.28318530718 / hullamhossz;
  float cs = pow(max(x01, 0.0), 1.0 / csillapitas);

  float f1 = sin(k * x01 - w * t + fazis);
  float f2 = sin(2.3 * k * x01 - 2.1 * w * t + fazis * 1.7);
  float f = f1 + fodro * f2;

  float dx = cs * f;
  float dy = vetules * cs * cos(k * x01 - w * t + fazis);
  float meredek = cs * (k * cos(k * x01 - w * t + fazis)
                        + fodro * 2.3 * k * cos(2.3 * k * x01 - 2.1 * w * t + fazis * 1.7));
  return vec3(dx, dy, meredek);
}

/* ugyanaz, de a külső-befoglaló torzításhoz egyszerűbb hullám (kevesebb fodro) */
vec3 hullamPersp(float x01, float y01, float t) {
  float w = 6.28318530718 * sebesseg;
  float k = 6.28318530718 / hullamhossz;
  float cs = pow(max(x01, 0.0), 1.0 / csillapitas);
  float f1 = sin(k * x01 - w * t + fazis);
  float f2 = sin(2.3 * k * x01 - 2.1 * w * t + fazis * 1.7);
  float f = f1 + fodro * f2;
  float meredek = cs * (k * cos(k * x01 - w * t + fazis)
                        + fodro * 2.3 * k * cos(2.3 * k * x01 - 2.1 * w * t + fazis * 1.7));
  /* a perspektivikus "mélység": a zászló a rúdtól távolodva kisebb
     és keskenyebb lesz, és a hullám ezt erősíti/halványítja */
  float mely = cs * f;
  /* a vízszintes összehúzódás: a zászló "befelé fordul" a rúd felé.
     A mértéket a perspektíva-csúszka adja (0 = sík, 1 = alap). */
  float dx = mely * amplitudo * 1.1 * max(perspektiva, 0.0);
  float dy = vetules * cs * cos(k * x01 - w * t + fazis);
  /* a magasság rövidülése: amerre a zászló "hátrafelé" hajol.
     Mértékkel — a túl erős zsugorodás bemetszést okoz a széleken. */
  float zsugor = 1.0 - abs(dx) * 1.15;
  zsugor = clamp(zsugor, 0.62, 1.25);
  /* a zászló közepe felé húzódik, és a közép is vándorol a széllel */
  float kozep = 0.5 + dy * 0.35;
  float v2 = kozep + (y01 - kozep) * zsugor;
  /* a függőleges hullámzás is ráül */
  v2 += dy * 0.55;
  return vec3(dx, v2, meredek);
}

void main() {
  /* a canvas UV (0..1) -> a zászló területére képezzük le */
  float x01 = uv.x;
  float y01 = uv.y;

  /* eleve kihagyjuk azt, ami a zászlón kívül esik */
  if (x01 < 0.0 || x01 > 1.0 || y01 < 0.0 || y01 > 1.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  /* a torzítás kiszámítása: sík (hullam) vagy perspektivikus (hullamPersp) */
  vec3 h;
  float u, v;
  if (perspektiva != 0.0) {
    h = hullamPersp(x01, y01, ido);
    u = x01 - h.x / max(amplitudo, 0.0001) * amplitudo;
    v = h.y;
  } else {
    h = hullam(x01, ido);
    u = x01 - h.x * amplitudo;
    v = y01 + h.y * vetules;
  }

  if (u < 0.0 || u > 1.0 || v < 0.0 || v > 1.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  vec4 szin = texture2D(zaszlo, vec2(u, v));

  /* a redők árnyékolása.
     FONTOS TANULSÁG: a MEREDEKSÉGBŐL számolt árnyék finom függőleges
     sávokat rajzol az egyszínű mezőkre (a meredekség gyorsan vált
     előjelet). Ezért az árnyékot magából a hullám ÉRTÉKÉBŐL vesszük,
     amely folytonos és lassan változik — így sima, sávmentes átmenet. */
  if (feny > 0.5) {
    float arny = clamp(h.x * 0.22, -0.26, 0.26);
    if (arny > 0.0) {
      szin.rgb += (1.0 - szin.rgb) * arny;
    } else {
      szin.rgb *= (1.0 + arny);
    }
  }

  /* a szélek lágyítása a zászló peremén.
     2 pixel átmenet — így a felső él nem lépcsőzik. */
  float perem = min(min(x01, 1.0 - x01) * terulet.x,
                    min(y01, 1.0 - y01) * terulet.y);
  float alfa = clamp(perem * 0.5, 0.0, 1.0);

  gl_FragColor = vec4(szin.rgb, szin.a * alfa);
}`;

/* ---- a WebGL-környezet (vásznanként külön!) ----
   FONTOS: egy oldalon több vászon is lehet (A/B/C mód), mindegyik
   SAJÁT WebGL-kontextussal. A program, a textúrák és a uniform-helyek
   KONTEKSTUSHOS kötöttek — ezért vásznanként külön kell tárolni.
   (Ha egyetlen közös _gl lenne, a második vásznon a program és a
   textúra érvénytelen lenne: fekete blokk jelenne meg.) */
const _motorok = new WeakMap();   /* canvas -> { gl, program, egyszer, texturak } */

function glElokeszit(canvas) {
  const meglevo = _motorok.get(canvas);
  if (meglevo) return true;
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false,
                                          preserveDrawingBuffer: true });
  if (!gl) return false;

  const program = gl.createProgram();
  for (const [tipus, forras] of [[gl.VERTEX_SHADER, CS_CS], [gl.FRAGMENT_SHADER, CS_FS]]) {
    const s = gl.createShader(tipus);
    gl.shaderSource(s, forras);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error("shader-hiba:", gl.getShaderInfoLog(s));
      return false;
    }
    gl.attachShader(program, s);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("program-hiba:", gl.getProgramInfoLog(program));
    return false;
  }
  gl.useProgram(program);

  /* egy négyszög, amely a teljes vásznat lefedi */
  const negy = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, negy);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,  1, -1,  -1, 1,
    -1, 1,   1, -1,   1, 1
  ]), gl.STATIC_DRAW);
  const hely = gl.getAttribLocation(program, "poz");
  gl.enableVertexAttribArray(hely);
  gl.vertexAttribPointer(hely, 2, gl.FLOAT, false, 0, 0);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  /* a uniform-helyek egyszer lekérve */
  const _egyszer = {
    ido: gl.getUniformLocation(program, "ido"),
    amplitudo: gl.getUniformLocation(program, "amplitudo"),
    hullamhossz: gl.getUniformLocation(program, "hullamhossz"),
    sebesseg: gl.getUniformLocation(program, "sebesseg"),
    csillapitas: gl.getUniformLocation(program, "csillapitas"),
    fodro: gl.getUniformLocation(program, "fodro"),
    vetules: gl.getUniformLocation(program, "vetules"),
    feny: gl.getUniformLocation(program, "feny"),
    fazis: gl.getUniformLocation(program, "fazis"),
    perspektiva: gl.getUniformLocation(program, "perspektiva"),
    terulet: gl.getUniformLocation(program, "terulet"),
    zaszlo: gl.getUniformLocation(program, "zaszlo")
  };
  _motorok.set(canvas, { gl: gl, program: program, egyszer: _egyszer, texturak: new Map() });
  return true;
}

/* ---- a zászló textúrája (a képből) ----
   FONTOS: a textúrákat KÉPENKÉNT cache-eljük. Ha csak egyetlen
   textúra-slot lenne, minden zászlóhoz újra fel kellene tölteni a
   képet (1200×800 RGBA ≈ 3,8 MB) — ez frame-enként 17 zászlónál
   ~65 MB feltöltést jelentene, ami 30 fps alá vinné a sebességet. */
function glTextura(motor, img) {
  if (motor.texturak.has(img)) return motor.texturak.get(img);
  const gl = motor.gl;
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  /* Az anizotróp szűrés (ha van) élesíti a ferde felületeket, és
     megszünteti a finom sávosságot a nagy textúrán. */
  const aniz = gl.getExtension("EXT_texture_filter_anisotropic") ||
               gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic");
  if (aniz) {
    const max = gl.getParameter(aniz.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
    gl.texParameterf(gl.TEXTURE_2D, aniz.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(16, max));
  }
  motor.texturak.set(img, tex);
  return tex;
}

/* ---- a lobogó zászló kirajzolása WebGL-lel ----
   A zászló a vászon egy téglalapjában van: (x, y, sz, mag).
   A shader a teljes vásznat kirajzolja, de csak a zászló területén
   ír színt (az UV-t a területre képezzük le egy viewport-tal). */
function lobogoZaszloGL(canvas, img, x, y, sz, mag, t, beall) {
  if (!glElokeszit(canvas)) return false;
  const motor = _motorok.get(canvas);
  const gl = motor.gl;
  const egyszer = motor.egyszer;
  const b = beall ? Object.assign({}, LOB, beall) : LOB;

  glTextura(motor, img);

  /* a viewport a zászló téglalapja — így az UV 0..1 pontosan oda képez */
  gl.viewport(x, canvas.height - (y + mag), sz, mag);

  gl.useProgram(motor.program);
  gl.uniform1f(egyszer.ido, t);
  gl.uniform1f(egyszer.amplitudo, b.amplitudo);
  gl.uniform1f(egyszer.hullamhossz, b.hullamhossz);
  gl.uniform1f(egyszer.sebesseg, b.sebesseg);
  gl.uniform1f(egyszer.csillapitas, b.csillapitas);
  gl.uniform1f(egyszer.fodro, b.fodro);
  gl.uniform1f(egyszer.vetules, b.vetules);
  gl.uniform1f(egyszer.feny, b.feny ? 1 : 0);
  gl.uniform1f(egyszer.fazis, b.fazis);
  /* a perspektiva lehet logikai (true/false) vagy szám (0..2)
     — így a csúszka folyamatosan szabályozhatja */
  gl.uniform1f(egyszer.perspektiva,
    b.perspektiva === true ? 1 : (b.perspektiva === false ? 0 : (b.perspektiva || 0)));
  gl.uniform2f(egyszer.terulet, sz, mag);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, glTextura(motor, img));
  gl.uniform1i(egyszer.zaszlo, 0);

  gl.drawArrays(gl.TRIANGLES, 0, 6);
  return true;
}

/* ---- van-e WebGL egyáltalán? ---- */
function vanWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl") || c.getContext("experimental-webgl"));
  } catch (e) { return false; }
}

/* ---- a zászló betöltése képként ---- */
function zaszloBetolt(betu, szelesseg) {
  return new Promise(function (res, rej) {
    const img = new Image();
    img.onload = function () { res(img); };
    img.onerror = function () { rej(new Error("Nem töltődött be: " + betu)); };
    /* FIGYELEM: a data-URI-nál NEM szabad crossOrigin-t állítani —
       egyes böngészők hibásnak jelzik, és a kép sosem tölt be. */
    img.src = flagDataUri(betu, szelesseg);
  });
}
