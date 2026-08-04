const puppeteer = require("/Users/halawa/code/fawtar/node_modules/puppeteer-core");
const file = process.argv[2] || "marks.html";
const out  = process.argv[3] || "marks.png";
const h    = Number(process.argv[4] || 1000);
(async () => {
  const b = await puppeteer.launch({executablePath:"/Users/halawa/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--allow-file-access-from-files","--font-render-hinting=none"]});
  const p = await b.newPage();
  await p.setViewport({width:1200,height:h,deviceScaleFactor:2});
  await p.goto("file:///Users/halawa/code/Elkhamees-/concepts/rebrand-2026/"+file,{waitUntil:"networkidle0"});
  await p.evaluateHandle("document.fonts.ready");
  await p.screenshot({path:out, fullPage:true});
  await b.close(); console.log("ok "+out);
})();
