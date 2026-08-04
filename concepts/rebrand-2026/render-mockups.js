const puppeteer = require("/Users/halawa/code/fawtar/node_modules/puppeteer-core");
(async () => {
  const b = await puppeteer.launch({executablePath:"/Users/halawa/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--allow-file-access-from-files","--font-render-hinting=none"]});
  const p = await b.newPage();
  await p.setViewport({width:1123,height:794,deviceScaleFactor:2});
  await p.goto("file:///Users/halawa/code/Elkhamees-/concepts/rebrand-2026/mockups.html",{waitUntil:"networkidle0"});
  await p.evaluateHandle("document.fonts.ready");
  const over = await p.evaluate(()=>{const o=[];document.querySelectorAll(".p").forEach((s,i)=>{if(s.scrollHeight>s.clientHeight+2)o.push([i+1,s.scrollHeight-s.clientHeight]);});return o;});
  const els = await p.$$(".p");
  for (let i=0;i<els.length;i++) await els[i].screenshot({path:`mk-${String(i+1).padStart(2,"0")}.png`});
  await p.pdf({path:"AlKhamees-Showroom-Packaging.pdf", width:"297mm", height:"210mm", printBackground:true, preferCSSPageSize:true});
  await b.close();
  console.log("pages:",els.length,"overflow:",JSON.stringify(over));
})();
