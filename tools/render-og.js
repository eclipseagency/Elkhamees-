/*
 * صورة المشاركة (og:image) — 1200×630، تُبنى من الهوية لا من صورة منتج.
 *   node tools/render-og.js
 *
 * أونيكس، علامة الخاء بذهب الهوية المسطّح، الاسم والتوقيع اللاتيني، وخيط
 * شعري. تُعاد كتابتها كلما تغيّر الاسم في data/catalogue.js أو لون الهوية.
 * تحتاج Chrome محلياً — لا تُشغَّل في النشر، والملف الناتج يُرفع في Git.
 */
'use strict';
var path = require('path');
var D = require('../data/catalogue.js');
var puppeteer = require('/Users/halawa/code/fawtar/node_modules/puppeteer-core');
var CHROME = '/Users/halawa/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
var OUT = path.join(__dirname, '..', 'assets', 'brand', 'og.jpg');

var KHA = 'M156 70 C156 78 150 82 142 82 L86 82 C62 82 52 96 52 112 C52 132 70 144 92 144 ' +
  'C120 144 142 128 154 106 C150 138 122 158 90 158 C58 158 34 138 34 110 ' +
  'C34 84 56 66 88 66 L142 66 C150 66 156 64 156 70 Z';

var html = '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">' +
  '<link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Reem+Kufi:wght@400..700&family=Bodoni+Moda:opsz,wght@6..96,400&display=swap" rel="stylesheet">' +
  '<style>' +
  '*{margin:0;box-sizing:border-box}' +
  'body{width:1200px;height:630px;background:#0B0B0C;display:flex;flex-direction:column;' +
  'align-items:center;justify-content:center;gap:34px;font-family:Amiri,serif;overflow:hidden;position:relative}' +
  'body::after{content:"";position:absolute;inset:40px;border:1px solid rgba(201,162,39,.28)}' +
  'svg{width:150px;height:150px;fill:#C9A227}' +
  '.n{font-family:"Reem Kufi",sans-serif;font-weight:500;font-size:70px;color:#EDE7DC;line-height:1}' +
  '.l{font-family:"Bodoni Moda",serif;font-size:17px;letter-spacing:9px;text-indent:9px;color:#C9A227}' +
  '.r{width:120px;height:1px;background:#C9A227}' +
  '.t{font-size:26px;color:#8A857D;line-height:1}' +
  '</style></head><body>' +
  '<svg viewBox="23 22 144 144"><path d="' + KHA + '"/>' +
  '<path d="M100 28 L114 44 L100 60 L86 44 Z"/></svg>' +
  '<div class="n">' + D.BRAND.name + '</div>' +
  '<div class="l">AL KHAMEES JEWELLERY</div>' +
  '<div class="r"></div>' +
  '<div class="t">' + D.BRAND.tagline + '</div>' +
  '</body></html>';

(async function () {
  var b = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
    args: ['--font-render-hinting=none'] });
  var p = await b.newPage();
  await p.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await p.setContent(html, { waitUntil: 'networkidle0' });
  await p.evaluateHandle('document.fonts.ready');
  await new Promise(function (r) { setTimeout(r, 700); });
  await p.screenshot({ path: OUT, type: 'jpeg', quality: 92 });
  await b.close();
  console.log('كُتبت ' + OUT);
})();
