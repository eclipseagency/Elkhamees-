const puppeteer = require("/Users/halawa/code/fawtar/node_modules/puppeteer-core");
(async () => {
  const b = await puppeteer.launch({executablePath:"/Users/halawa/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--allow-file-access-from-files","--font-render-hinting=none"]});
  const p = await b.newPage();
  await p.goto("file:///Users/halawa/code/Elkhamees-/concepts/rebrand-2026/brandbook.html",{waitUntil:"networkidle0"});
  await p.evaluateHandle("document.fonts.ready");
  await p.pdf({path:"AlKhamees-Brand-Identity.pdf", width:"297mm", height:"210mm", printBackground:true, preferCSSPageSize:true});
  await b.close(); console.log("done");
})();
