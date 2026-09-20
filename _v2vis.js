/* v2 vizuális teszt: desktop (laptop) + mobil nézet + JS-hibák */
const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const WebSocket = require("ws");
const PORT = 9300;
function httpGet(u){return new Promise((res,rej)=>{http.get(u,r=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>res(d));}).on("error",rej);});}
const kes = ms => new Promise(r=>setTimeout(r,ms));
(async()=>{
  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",[
    "--remote-debugging-port="+PORT,"--no-first-run","--no-default-browser-check",
    "--window-size=1440,900","--window-position=100,40",
    "--user-data-dir=/tmp/chrome-v2-"+Date.now()
  ],{stdio:"ignore"});
  let cel=null;
  for(let i=0;i<40;i++){try{const j=JSON.parse(await httpGet("http://localhost:"+PORT+"/json/list"));cel=j.find(t=>t.type==="page");if(cel)break;}catch(e){}await kes(400);}
  const ws=new WebSocket(cel.webSocketDebuggerUrl);
  let id=0;const v={};
  ws.on("message",m=>{const j=JSON.parse(m);if(j.id&&v[j.id]){v[j.id](j);delete v[j.id];}});
  const P=(m,p={})=>new Promise(r=>{const i=++id;v[i]=r;ws.send(JSON.stringify({id:i,method:m,params:p}));});
  await new Promise(r=>ws.on("open",r));
  await P("Runtime.enable");await P("Page.enable");
  const hibak=[];
  ws.on("message",m=>{const j=JSON.parse(m);
    if(j.method==="Runtime.exceptionThrown"){hibak.push(j.params.exceptionDetails.exception?.description||j.params.exceptionDetails.text);}});
  const ev=async(e,ap)=>{const r=await P("Runtime.evaluate",{expression:e,awaitPromise:!!ap,returnByValue:true});
    if(r.result.exceptionDetails) return {err:r.result.exceptionDetails.exception?.description};
    return {val:r.result.result.value};};

  /* --- DESKTOP --- */
  await P("Page.navigate",{url:"http://localhost:8911/index.html"});
  await kes(5000);
  const sh=await P("Page.captureScreenshot",{format:"png"});
  fs.writeFileSync("_kepek/v2-desktop.png", Buffer.from(sh.result.data,"base64"));
  const d1 = await ev(`(function(){
    var h=document.documentElement.scrollHeight, w=window.innerHeight;
    return JSON.stringify({scrollH:h, viewH:w, fér:h<=w+40,
      cAw:document.getElementById('cvA').width, cAh:document.getElementById('cvA').height});
  })()`);
  console.log("DESKTOP:", d1.val);

  /* --- MOBIL (iPhone méret) --- */
  await P("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:3,mobile:true});
  await kes(2500);
  const sh2=await P("Page.captureScreenshot",{format:"png"});
  fs.writeFileSync("_kepek/v2-mobil.png", Buffer.from(sh2.result.data,"base64"));
  const m1 = await ev(`(function(){
    var n=document.getElementById('alsoSav');
    var lathato = getComputedStyle(n).display;
    return JSON.stringify({alsoSav:lathato, gombok:n.querySelectorAll('button').length});
  })()`);
  console.log("MOBIL:", m1.val);
  /* mobil: zászlók nézet */
  await ev("document.querySelectorAll('#alsoSav button')[0].click()");
  await kes(1200);
  const sh3=await P("Page.captureScreenshot",{format:"png"});
  fs.writeFileSync("_kepek/v2-mobil-zaszlo.png", Buffer.from(sh3.result.data,"base64"));
  /* mobil: B nézet */
  await ev("document.querySelectorAll('#alsoSav button')[1].click()");
  await kes(1600);
  const sh4=await P("Page.captureScreenshot",{format:"png"});
  fs.writeFileSync("_kepek/v2-mobil-b.png", Buffer.from(sh4.result.data,"base64"));
  console.log("JS hibák:", hibak.length? hibak.join(" | ") : "nincs");
  console.log("kesz");
  ws.close();chrome.kill();process.exit(0);
})();
