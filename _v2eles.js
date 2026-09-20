/* v2 ÉLES teszt a GitHub Pages-en */
const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const WebSocket = require("ws");
const PORT = 9302;
const URL = "https://robertclaw202604.github.io/zaszlo-abc-v2/";
function httpGet(u){return new Promise((res,rej)=>{http.get(u,r=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>res(d));}).on("error",rej);});}
const kes = ms => new Promise(r=>setTimeout(r,ms));
(async()=>{
  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",[
    "--remote-debugging-port="+PORT,"--no-first-run","--no-default-browser-check",
    "--window-size=1440,1000","--window-position=100,30",
    "--user-data-dir=/tmp/chrome-v2e-"+Date.now()
  ],{stdio:"ignore"});
  let cel=null;
  for(let i=0;i<40;i++){try{const j=JSON.parse(await httpGet("http://localhost:"+PORT+"/json/list"));cel=j.find(t=>t.type==="page");if(cel)break;}catch(e){}await kes(400);}
  const ws=new WebSocket(cel.webSocketDebuggerUrl);
  let id=0;const v={};
  ws.on("message",m=>{const j=JSON.parse(m);if(j.id&&v[j.id]){v[j.id](j);delete v[j.id];}});
  await new Promise(r=>ws.on("open",r));
  await P("Runtime.enable");await P("Page.enable");
  function P(m,p={}){return new Promise(r=>{const i=++id;v[i]=r;ws.send(JSON.stringify({id:i,method:m,params:p}));});}
  await P("Network.enable");
  const hibak=[];
  ws.on("message",m=>{const j=JSON.parse(m);
    if(j.method==="Runtime.exceptionThrown")hibak.push(j.params.exceptionDetails.exception?.description||j.params.exceptionDetails.text);
    if(j.method==="Network.loadingFailed")hibak.push("betöltés: "+j.params.errorText);});
  const ev=async(e,ap)=>{const r=await P("Runtime.evaluate",{expression:e,awaitPromise:!!ap,returnByValue:true});
    if(r.result.exceptionDetails) return {err:r.result.exceptionDetails.exception?.description};
    return {val:r.result.result.value};};
  let ok=0,buk=0;
  const ell=(n,f)=>{ if(f){ok++;console.log("✓ "+n);} else {buk++;console.log("✗ "+n);} };
  await P("Page.navigate",{url:URL});
  await kes(7000);
  ell("az oldal betölt", (await ev("document.title")).val.includes("Jelzőzászló"));
  ell("a zászlók betöltődtek", (await ev("Object.keys(kepek).length")).val > 5);
  ell("a zászlók rajzolódnak", (await ev(`(function(){
    var gl=cA.getContext('webgl');var k=new Uint8Array(cA.width*cA.height*4);
    gl.readPixels(0,0,cA.width,cA.height,gl.RGBA,gl.UNSIGNED_BYTE,k);
    var s=0;for(var i=0;i<k.length;i+=4){if(k[i]>90||k[i+1]>90||k[i+2]>90)s++;}
    return s;})()`)).val > 20000);
  ell("60 fps körül fut", (await ev("parseInt(document.getElementById('fpsA').textContent)")).val >= 30);
  ell("a desktop nézet befér egy képernyőre", (await ev("document.documentElement.scrollHeight <= window.innerHeight + 60")).val===true);
  ell("a manifest elérhető", await ev(`fetch('manifest.webmanifest').then(r=>r.ok)`,true).then(r=>r.val===true));
  ell("a service worker regisztrál", await ev(`navigator.serviceWorker.getRegistrations().then(r=>r.length>0)`,true).then(r=>r.val===true));
  await ev("document.querySelectorAll('#fulek button')[1].click()");
  await kes(1500);
  ell("a B nézet működik élesben", (await ev(`(function(){
    var c=document.getElementById('cvBbetu');var ctx=c.getContext('2d');
    var d=ctx.getImageData(0,0,c.width,c.height).data;var db=0;
    for(var i=0;i<d.length;i+=4){if(d[i+3]>30&&d[i]>150)db++;}return db;})()`)).val > 5000);
  ell("nincs éles hiba", hibak.length===0);
  if(hibak.length) console.log("  hibák:", hibak.slice(0,4).join(" | "));
  console.log("\n"+ok+"/"+(ok+buk)+" ÉLES teszt sikeres");
  ws.close();chrome.kill();process.exit(0);
})();
