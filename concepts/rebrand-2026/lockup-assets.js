const puppeteer = require("/Users/halawa/code/fawtar/node_modules/puppeteer-core");
const KHA = (c) => `<path d="M156 70 C156 78 150 82 142 82 L86 82 C62 82 52 96 52 112 C52 132 70 144 92 144 C120 144 142 128 154 106 C150 138 122 158 90 158 C58 158 34 138 34 110 C34 84 56 66 88 66 L142 66 C150 66 156 64 156 70 Z" fill="${c}"/><path d="M100 28 L114 44 L100 60 L86 44 Z" fill="${c}"/>`;
const page = (mark, txt) => `<style>html,body{margin:0;background:transparent}
 .l{display:inline-block;text-align:left;padding:0}
 .l svg{display:block;width:300px;height:320px;margin-bottom:64px}
 .n{display:block;white-space:nowrap;font-family:'Avenir Next';font-weight:200;font-size:64px;letter-spacing:14.6px;color:${txt}}</style>
 <div class="l"><svg xmlns="http://www.w3.org/2000/svg" viewBox="34 28 122 130">${KHA(mark)}</svg>
 <span class="n">MUSAID ALKHAMEES</span></div>`;
const jobs = [["lockup-ink.png","#141416","#141416"],["lockup-gold.png","#C9A227","#C9A227"],["lockup-ivory.png","#EDE7DC","#EDE7DC"]];
(async () => {
  const b = await puppeteer.launch({executablePath:"/Users/halawa/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new"});
  const p = await b.newPage();
  await p.setViewport({width:1400,height:600,deviceScaleFactor:2});
  for (const [name, mark, txt] of jobs) {
    await p.setContent(page(mark, txt));
    const el = await p.$(".l");
    await el.screenshot({path:"logo/"+name, omitBackground:true});
  }
  await b.close(); console.log("lockup assets");
})();
