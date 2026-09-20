/* v2 funkcionális teszt — a motor és a felület együtt */
const { spawn } = require("child_process");
const http = require("http");
const WebSocket = require("ws");
const PORT = 9301;
function httpGet(u){return new Promise((res,rej)=>{http.get(u,r=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>res(d));}).on("error",rej);});}
const kes = ms => new Promise(r=>setTimeout(r,ms));
(async()=>{
  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",[
    "--remote-debugging-port="+PORT,"--no-first-run","--no-default-browser-check",
    "--window-size=1440,1000","--window-position=100,30",
    "--user-data-dir=/tmp/chrome-v2t-"+Date.now()
  ],{stdio:"ignore"});
  let cel=null;
  for(let i=0;i<40;i++){try{const j=JSON.parse(await httpGet("http://localhost:"+PORT+"/json/list"));cel=j.find(t=>t.type==="page");if(cel)break;}catch(e){}await kes(400);}
  const ws=new WebSocket(cel.webSocketDebuggerUrl);
  let id=0;const v={};
  ws.on("message",m=>{const j=JSON.parse(m);if(j.id&&v[j.id]){v[j.id](j);delete v[j.id];}});
  await new Promise(r=>ws.on("open",r));
  await P("Runtime.enable");await P("Page.enable");
  function P(m,p={}){return new Promise(r=>{const i=++id;v[i]=r;ws.send(JSON.stringify({id:i,method:m,params:p}));});}
  const hibak=[];
  ws.on("message",m=>{const j=JSON.parse(m);
    if(j.method==="Runtime.exceptionThrown")hibak.push(j.params.exceptionDetails.exception?.description||j.params.exceptionDetails.text);});
  const ev=async(e,ap)=>{const r=await P("Runtime.evaluate",{expression:e,awaitPromise:!!ap,returnByValue:true});
    if(r.result.exceptionDetails) return {err:r.result.exceptionDetails.exception?.description};
    return {val:r.result.result.value};};
  let ok=0,buk=0;
  const ell=(n,f)=>{ if(f){ok++;console.log("✓ "+n);} else {buk++;console.log("✗ "+n);} };

  await P("Page.navigate",{url:"http://localhost:8911/index.html"});
  await kes(5000);
  ell("a szöveg bekerül a mezőbe", (await ev("document.getElementById('szo').value")).val==="BUDAHÁZY SZABOLCS");
  ell("a zászlók betöltődtek", (await ev("Object.keys(kepek).length")).val > 5);
  ell("a betűk száma helyes", (await ev("betuk.length")).val===17);
  ell("a zászlók száma helyes", (await ev("betuk.filter(zaszloE).length")).val===16);
  const fps1 = await ev("document.getElementById('fpsA').textContent");
  ell("van fps kijelzés", /\d+ fps/.test(fps1.val||""));
  /* A mód zászló-rajzolás */
  const zaszloPix = await ev(`(function(){
    var gl=cA.getContext('webgl');
    var k=new Uint8Array(cA.width*cA.height*4);
    gl.readPixels(0,0,cA.width,cA.height,gl.RGBA,gl.UNSIGNED_BYTE,k);
    var szines=0;
    for(var i=0;i<k.length;i+=4){ if(k[i]>90||k[i+1]>90||k[i+2]>90) szines++; }
    return szines;
  })()`);
  ell("az A módban látszanak a zászlók", zaszloPix.val > 20000);
  /* a színpad befér */
  const fer = await ev("document.documentElement.scrollHeight <= window.innerHeight + 60");
  ell("a desktop nézet egy képernyőre fér", fer.val===true);
  /* fülek */
  await ev("document.querySelectorAll('#fulek button')[1].click()");
  await kes(1500);
  ell("a B fül aktiválódik", (await ev("mod")).val==="B");
  const betuPix = await ev(`(function(){
    var c=document.getElementById('cvBbetu');var ctx=c.getContext('2d');
    if(!ctx)return -1;
    var d=ctx.getImageData(0,0,c.width,c.height).data;var db=0;
    for(var i=0;i<d.length;i+=4){if(d[i+3]>30&&d[i]>150)db++;}
    return db;
  })()`);
  ell("a B módban megjelenik a nagy betű", betuPix.val > 5000);
  /* B betű kapcsoló */
  await ev("document.getElementById('betuGombB').click()");
  await kes(900);
  const betuPix2 = await ev(`(function(){
    var c=document.getElementById('cvBbetu');var ctx=c.getContext('2d');
    var d=ctx.getImageData(0,0,c.width,c.height).data;var db=0;
    for(var i=0;i<d.length;i+=4){if(d[i+3]>30&&d[i]>150)db++;}
    return db;
  })()`);
  ell("a B betű-kapcsoló kikapcsol", betuPix2.val < 500);
  await ev("document.getElementById('betuGombB').click()");
  await kes(700);
  /* C fül */
  await ev("document.querySelectorAll('#fulek button')[2].click()");
  await kes(1200);
  ell("a C fül aktiválódik", (await ev("mod")).val==="C");
  /* PNG export */
  await ev("document.querySelectorAll('#fulek button')[0].click()");
  await kes(1200);
  const png = await ev(`(async function(){
    var src=exportSor(betuk,kepek,cA.width,cA.height,1.0,LOB,null,zaszloMag);
    if(!src) return 'nincs';
    return src.toDataURL('image/png').slice(0,20)+'|'+src.width+'x'+src.height;
  })()`,true);
  ell("a PNG-export működik", String(png.val||"").startsWith("data:image/png"));
  /* link */
  await ev("szoAzUrlben('TESZT')");
  ell("a link a szóval frissül", (await ev("location.search")).val.includes("szo=TESZT"));
  /* mobil nézet + alsó sáv */
  await P("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:3,mobile:true});
  await kes(1500);
  ell("mobilon megjelenik az alsó navigáció", (await ev("getComputedStyle(document.getElementById('alsoSav')).display")).val==="flex");
  await ev("document.querySelectorAll('#alsoSav button')[1].click()");
  await kes(1200);
  ell("az alsó navigáció vált nézetet", (await ev("mod")).val==="B");
  ell("nincs JavaScript hiba", hibak.length===0);
  if(hibak.length) console.log("  hibák:", hibak.slice(0,3).join(" | "));
  console.log("\n"+ok+"/"+(ok+buk)+" teszt sikeres");
  ws.close();chrome.kill();process.exit(0);
})();
