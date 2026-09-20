/* Annak igazolása, hogy B nézetben az A-sor NEM látszik */
const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const WebSocket = require("ws");
const PORT = 9303;
function httpGet(u){return new Promise((res,rej)=>{http.get(u,r=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>res(d));}).on("error",rej);});}
const kes = ms => new Promise(r=>setTimeout(r,ms));
(async()=>{
  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",[
    "--remote-debugging-port="+PORT,"--no-first-run","--no-default-browser-check",
    "--window-size=1440,1000","--window-position=100,30",
    "--user-data-dir=/tmp/chrome-v2f-"+Date.now()
  ],{stdio:"ignore"});
  let cel=null;
  for(let i=0;i<40;i++){try{const j=JSON.parse(await httpGet("http://localhost:"+PORT+"/json/list"));cel=j.find(t=>t.type==="page");if(cel)break;}catch(e){}await kes(400);}
  const ws=new WebSocket(cel.webSocketDebuggerUrl);
  let id=0;const v={};
  ws.on("message",m=>{const j=JSON.parse(m);if(j.id&&v[j.id]){v[j.id](j);delete v[j.id];}});
  await new Promise(r=>ws.on("open",r));
  await P("Runtime.enable");await P("Page.enable");
  function P(m,p={}){return new Promise(r=>{const i=++id;v[i]=r;ws.send(JSON.stringify({id:i,method:m,params:p}));});}
  const ev=async(e,ap)=>{const r=await P("Runtime.evaluate",{expression:e,awaitPromise:!!ap,returnByValue:true});
    return r.result.exceptionDetails?{err:r.result.exceptionDetails.text}:{val:r.result.result.value};};
  await P("Page.navigate",{url:"http://localhost:8911/index.html"});
  await kes(5500);
  const aLatszik = await ev("(function(){var s=document.getElementById('stageA');return s.offsetParent!==null;})()");
  console.log("A nézetben az A-sor látszik:", aLatszik.val);
  /* B nézet */
  await ev("document.querySelectorAll('#fulek button')[1].click()");
  await kes(1800);
  const bAllapot = await ev(`(function(){
    var a=document.getElementById('stageA');
    var pa=document.getElementById('p-A'), pb=document.getElementById('p-B');
    return JSON.stringify({
      aSorLatszik: a.offsetParent!==null,
      pA: getComputedStyle(pa).display,
      pB: getComputedStyle(pb).display
    });
  })()`);
  console.log("B nézet:", bAllapot.val);
  const sh=await P("Page.captureScreenshot",{format:"png"});
  fs.writeFileSync("_kepek/v2-b-javított.png", Buffer.from(sh.result.data,"base64"));
  /* C nézet */
  await ev("document.querySelectorAll('#fulek button')[2].click()");
  await kes(1500);
  const cAll = await ev("(function(){var s=document.getElementById('stageA');return s.offsetParent!==null;})()");
  console.log("C nézetben az A-sor látszik (nem kell):", cAll.val);
  const sh2=await P("Page.captureScreenshot",{format:"png"});
  fs.writeFileSync("_kepek/v2-c-javított.png", Buffer.from(sh2.result.data,"base64"));
  ws.close();chrome.kill();process.exit(0);
})();
