/*
 * يرسم التوقيع المكدّس PNG شفافاً باسم الموقع نفسه.
 *   node tools/render-lockup.js
 *
 * لماذا: توقيعات `concepts/rebrand-2026/logo/lockup-*.png` مكتوبة
 * «مساعد الخميس / MUSAID ALKHAMEES»، والموقع اسمه «مجوهرات الخميس».
 * تركيب التوقيع القديم على واجهة المحل في صور الهوية يضع على الموقع
 * اسماً غير اسمه. هذا الملف يبني التوقيع من `data/catalogue.js` بنفس
 * خطوط الموقع، فيبقى الاثنان اسماً واحداً.
 *
 * المقاس 2643×1413 هو مقاس lockup-ink.png نفسه، فتبقى نِسَب التركيب في
 * concepts/rebrand-2026/mockups/composite.py صالحة كما هي.
 */
'use strict';
var path = require('path');
var D = require('../data/catalogue.js');
var puppeteer = require('/Users/halawa/code/fawtar/node_modules/puppeteer-core');
var CHROME = '/Users/halawa/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
var OUT = path.join(__dirname, '..', 'assets', 'brand', 'lockup-stack-ink.png');

var KHA = 'M156 70 C156 78 150 82 142 82 L86 82 C62 82 52 96 52 112 C52 132 70 144 92 144 ' +
  'C120 144 142 128 154 106 C150 138 122 158 90 158 C58 158 34 138 34 110 ' +
  'C34 84 56 66 88 66 L142 66 C150 66 156 64 156 70 Z';

var html = '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">' +
  '<link href="https://fonts.googleapis.com/css2?family=Reem+Kufi:wght@400..700&family=Bodoni+Moda:opsz,wght@6..96,400&display=swap" rel="stylesheet">' +
  '<style>*{margin:0;box-sizing:border-box}html,body{background:transparent}' +
  'body{width:2643px;height:1413px;display:flex;flex-direction:column;align-items:center;' +
  'justify-content:center;gap:74px}' +
  'svg{width:560px;height:560px;fill:#141416;display:block}' +
  '.n{font-family:"Reem Kufi",sans-serif;font-weight:500;font-size:250px;color:#141416;line-height:1}' +
  '.l{font-family:"Bodoni Moda",serif;font-size:66px;letter-spacing:34px;text-indent:34px;color:#141416}' +
  '</style></head><body>' +
  '<svg viewBox="23 22 144 144"><path d="' + KHA + '"/>' +
  '<path d="M100 28 L114 44 L100 60 L86 44 Z"/></svg>' +
  '<div class="n">' + D.BRAND.name + '</div>' +
  '<div class="l">AL KHAMEES JEWELLERY</div>' +
  '</body></html>';

(async function () {
  var b = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
    args: ['--font-render-hinting=none'] });
  var p = await b.newPage();
  await p.setViewport({ width: 2643, height: 1413, deviceScaleFactor: 1 });
  await p.setContent(html, { waitUntil: 'networkidle0' });
  await p.evaluateHandle('document.fonts.ready');
  await new Promise(function (r) { setTimeout(r, 700); });
  await p.screenshot({ path: OUT, omitBackground: true });
  await b.close();
  console.log('كُتب ' + OUT);
})();
