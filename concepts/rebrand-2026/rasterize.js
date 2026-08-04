const puppeteer = require("/Users/halawa/code/fawtar/node_modules/puppeteer-core");
const KHA = (c) => `<path d="M156 70 C156 78 150 82 142 82 L86 82 C62 82 52 96 52 112 C52 132 70 144 92 144 C120 144 142 128 154 106 C150 138 122 158 90 158 C58 158 34 138 34 110 C34 84 56 66 88 66 L142 66 C150 66 156 64 156 70 Z" fill="${c}"/><path d="M100 28 L114 44 L100 60 L86 44 Z" fill="${c}"/>`;
const SEAL = (c) => `<circle cx="100" cy="100" r="92" fill="none" stroke="${c}" stroke-width="2.5"/><path d="M148 76 C148 83 143 86 136 86 L88 86 C68 86 60 98 60 111 C60 128 75 138 94 138 C118 138 136 125 146 107 C142 133 118 150 91 150 C64 150 44 133 44 109 C44 87 63 72 90 72 L136 72 C143 72 148 70 148 76 Z" fill="${c}"/><path d="M100 38 L112 52 L100 66 L88 52 Z" fill="${c}"/>`;
const jobs = [
  ["kha-ink.png",   KHA("#141416")], ["kha-gold.png",  KHA("#C9A227")],
  ["seal-ink.png",  SEAL("#141416")], ["seal-gold.png", SEAL("#C9A227")],
];
(async () => {
  const b = await puppeteer.launch({executablePath:"/Users/halawa/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new",args:["--allow-file-access-from-files"]});
  const p = await b.newPage();
  await p.setViewport({width:1200,height:1200,deviceScaleFactor:1});
  for (const [name, body] of jobs) {
    await p.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block}</style><svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 200 200">${body}</svg>`);
    await p.screenshot({path:"mockups/"+name, omitBackground:true});
  }
  await b.close(); console.log("rasterized");
})();
