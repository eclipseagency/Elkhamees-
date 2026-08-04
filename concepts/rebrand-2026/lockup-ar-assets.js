const puppeteer = require("/Users/halawa/code/fawtar/node_modules/puppeteer-core");
const KHA = (c) => `<path d="M156 70 C156 78 150 82 142 82 L86 82 C62 82 52 96 52 112 C52 132 70 144 92 144 C120 144 142 128 154 106 C150 138 122 158 90 158 C58 158 34 138 34 110 C34 84 56 66 88 66 L142 66 C150 66 156 64 156 70 Z" fill="${c}"/><path d="M100 28 L114 44 L100 60 L86 44 Z" fill="${c}"/>`;
const page = (mark, txt, latin) => `<style>
 @font-face{font-family:'Tajawal';src:url('fonts/Tajawal.ttf') format('truetype');}
 html,body{margin:0;background:transparent}
 .l{display:inline-block;text-align:center}
 .l svg{display:block;width:300px;height:320px;margin:0 auto 52px}
 .ar{display:block;white-space:nowrap;font-family:'Tajawal';font-size:96px;color:${txt};line-height:1.35}
 .la{display:block;white-space:nowrap;font-family:'Avenir Next';font-weight:200;font-size:38px;
     letter-spacing:11px;text-indent:11px;color:${latin};margin-top:26px}</style>
 <div class="l" dir="rtl"><svg xmlns="http://www.w3.org/2000/svg" viewBox="34 28 122 130">${KHA(mark)}</svg>
 <span class="ar">مساعد الخميس</span><span class="la">MUSAID ALKHAMEES</span></div>`;
const jobs = [["lockup-ar-ink.png","#141416","#141416","#6B6459"],
              ["lockup-ar-gold.png","#C9A227","#EDE7DC","#C9A227"],
              ["lockup-ar-ivory.png","#EDE7DC","#EDE7DC","#C9A227"]];
(async () => {
  const b = await puppeteer.launch({executablePath:"/Users/halawa/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--allow-file-access-from-files"]});
  const p = await b.newPage();
  await p.setViewport({width:1600,height:900,deviceScaleFactor:3});
  for (const [name, mark, txt, latin] of jobs) {
    await p.goto("file:///Users/halawa/code/Elkhamees-/concepts/rebrand-2026/blank.html");
    await p.setContent(page(mark, txt, latin));
    await p.evaluateHandle("document.fonts.ready");
    const el = await p.$(".l");
    await el.screenshot({path:"logo/"+name, omitBackground:true});
  }
  await b.close(); console.log("arabic lockup assets");
})();
