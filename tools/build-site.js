/*
 * مجوهرات الخميس — مولّد الموقع.
 *   node tools/build-site.js
 *
 * يبني كل صفحات الموقع من data/catalogue.js حسب الهيكل المتفق عليه في
 * docs/sitemap.md. لا توجد صفحة تُحرّر يدوياً: عدّل البيانات، أعد التشغيل.
 *
 * لماذا صفحات ثابتة منفصلة لا صفحة واحدة:
 * المستند يحدد مسارات حقيقية (/jewellery/rings، /piece/<slug>)، وموقع مجوهرات
 * يعيش على البحث والمشاركة، فالمسار الحقيقي يُفهرس ويُشارك بينما الـ hash لا.
 * و`cleanUrls: true` في vercel.json يخدم jewellery.html على /jewellery.
 *
 * القرار الأهم في المستند: الموقع واجهة عرض تنتهي بمحادثة واتساب.
 * لا عربة، لا دفع، لا حساب. كل زر رئيسي في الموقع يقود إلى المحادثة،
 * ورسالة القطعة تحمل اسمها ورقمها حتى يعرف الموظف الموضوع من أول سطر.
 */
'use strict';

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var D = require('../data/catalogue.js');

var ROOT = path.join(__dirname, '..');
var WA = D.BRAND.whatsapp;

/* الحسابات المتوفرة فعلاً. الفارغ لا يُطبع: رابط سوشيال يقود إلى صفحة
   غير موجودة يضرب ثقة موقع مجوهرات أكثر مما يفيد. */
var SOCIAL = [
  { ar: 'إنستقرام', url: D.BRAND.instagram },
  { ar: 'سناب شات', url: D.BRAND.snapchat },
  { ar: 'تيك توك', url: D.BRAND.tiktok }
].filter(function (x) { return x.url; });

/* بصمة محتوى لكل أصل. vercel.json يخدم /assets بـ immutable لسنة، فالملف
   المعدّل باسمه القديم يبقى في متصفح الزائر وفي الـCDN إلى ما لا نهاية —
   وهذا ما حجب قواعد الهوفر في site.css بعد نشرها (2026-07-30).
   البصمة تُحسب من المحتوى نفسه لا من رقم يُزاد يدوياً، فلا تُنسى مرة أخرى. */
var STAMPS = {};
function stamp(rel) {
  if (!(rel in STAMPS)) {
    try {
      STAMPS[rel] = crypto.createHash('md5')
        .update(fs.readFileSync(path.join(ROOT, rel))).digest('hex').slice(0, 8);
    } catch (e) { STAMPS[rel] = '0'; }
  }
  return STAMPS[rel];
}

/* ------------------------------------------------------------------ *
 * أدوات
 * ------------------------------------------------------------------ */
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
  });
}
/* كل روابط الواتساب تمر من هنا، فالرسالة موحّدة والرقم من مكان واحد. */
function wa(text) {
  return 'https://wa.me/' + WA + (text ? '?text=' + encodeURIComponent(text) : '');
}
function up(depth) { return depth === 0 ? '' : new Array(depth + 1).join('../'); }

/* فئة بلا قطع تُنتج صفحة فارغة وسطراً ميتاً في التنقّل. تُستبعد من البناء،
   وتعود وحدها أول ما تُضاف لها قطعة في data/catalogue.js. */
D.CATEGORIES = D.CATEGORIES.filter(function (c) {
  return D.PIECES.some(function (p) { return p.category === c.slug; });
});

var CAT = {};
D.CATEGORIES.forEach(function (c) { CAT[c.slug] = c; });
var OCC = {};
D.OCCASIONS.forEach(function (o) { OCC[o.slug] = o; });
var METAL = {};
D.METALS.forEach(function (m) { METAL[m.slug] = m.ar; });

function piecesIn(catSlug) {
  return D.PIECES.filter(function (p) { return p.category === catSlug; });
}
function piecesFor(occSlug) {
  return D.PIECES.filter(function (p) { return (p.occasions || []).indexOf(occSlug) !== -1; });
}
function priceLabel(p) {
  return p.price ? Number(p.price).toLocaleString('ar-EG') + ' ر.س' : 'اطلب السعر';
}

/* ------------------------------------------------------------------ *
 * القالب المشترك
 * ------------------------------------------------------------------ */
function layout(o) {
  var u = up(o.depth || 0);
  var navItems = [
    ['jewellery', 'المجوهرات'],
    ['occasions', 'المناسبات'],
    ['services', 'خدماتنا'],
    ['about', 'عن الدار'],
    ['faq', 'الأسئلة الشائعة'],
    ['contact', 'تواصل']
  ];
  var nav = navItems.map(function (n) {
    var on = o.active === n[0] ? ' class="on"' : '';
    return '<a href="' + u + n[0] + '"' + on + '>' + n[1] + '</a>';
  }).join('');

  return '<!DOCTYPE html>\n<html lang="ar" dir="rtl">\n<head>\n' +
'<meta charset="utf-8">\n' +
'<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
'<title>' + esc(o.title) + ' · ' + esc(D.BRAND.name) + '</title>\n' +
'<meta name="description" content="' + esc(o.description || D.BRAND.tagline) + '">\n' +
'<meta name="theme-color" content="#0b0908">\n' +
'<meta property="og:title" content="' + esc(o.title) + ' · ' + esc(D.BRAND.name) + '">\n' +
'<meta property="og:description" content="' + esc(o.description || D.BRAND.tagline) + '">\n' +
'<meta property="og:type" content="website">\n' +
'<link rel="icon" href="' + u + 'assets/monogram.svg">\n' +
'<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
'<link href="https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&family=Tajawal:wght@300;400;500;700&display=swap" rel="stylesheet">\n' +
'<link rel="stylesheet" href="' + u + 'assets/site.css?v=' + stamp('assets/site.css') + '">\n' +
'</head>\n<body>\n' +

'<div class="top">صناعة سعودية · ألماس موثّق بشهاداته · زيارة المعرض بموعد</div>\n' +

/* القائمة الجانبية (بريف العميل 2026-08-02): تُفتح من زرّ الهيدر على كل
   المقاسات لا الجوال وحده، ومقسّمة بخانات تعرض كل أقسام الموقع — فالقائمة
   العلوية تسع ستة روابط فقط بينما الموقع أكبر من ذلك.
   الأطقم تظهر هنا تلقائياً أول ما تُملأ SETS في data/catalogue.js. */
'<div class="side-veil" hidden></div>\n' +
'<aside class="side" id="side" hidden aria-label="قائمة الموقع" data-lenis-prevent>\n' +
'  <div class="side-head">\n' +
'    <img src="' + u + 'assets/wordmark-gold.png" alt="' + esc(D.BRAND.name) + '">\n' +
'    <button class="side-x" type="button" aria-label="إغلاق القائمة">✕</button>\n' +
'  </div>\n' +
'  <nav class="side-nav">\n' +
'    <section><h3>المجوهرات</h3>' +
       '<a href="' + u + 'jewellery">كل القطع</a>' +
       D.CATEGORIES.map(function (c) {
         return '<a href="' + u + 'jewellery/' + c.slug + '">' + esc(c.ar) + '</a>';
       }).join('') + '</section>\n' +
     (D.SETS.length
       ? '    <section><h3>الأطقم</h3>' + D.SETS.map(function (t) {
           return '<a href="' + u + 'sets/' + t.slug + '">' + esc(t.ar) + '</a>';
         }).join('') + '</section>\n'
       : '') +
'    <section><h3>المناسبات</h3>' +
       D.OCCASIONS.map(function (o) {
         return '<a href="' + u + 'occasions/' + o.slug + '">' + esc(o.ar) + '</a>';
       }).join('') + '</section>\n' +
'    <section><h3>الدار</h3>' +
       '<a href="' + u + 'services">خدماتنا</a>' +
       '<a href="' + u + 'about">عن الدار</a>' +
       '<a href="' + u + 'faq">الأسئلة الشائعة</a>' +
       '<a href="' + u + 'contact">تواصل وزيارة المعرض</a></section>\n' +
'    <section><h3>سياسات الدار</h3>' +
       '<a href="' + u + 'policies/returns">الاستبدال والاسترجاع</a>' +
       '<a href="' + u + 'policies/shipping">الشحن والتغليف</a>' +
       '<a href="' + u + 'policies/privacy">الخصوصية</a></section>\n' +
'  </nav>\n' +
'  <a class="side-wa" href="' + wa('السلام عليكم، عندي استفسار عن مجوهرات الخميس.') + '" target="_blank" rel="noopener">راسلنا على واتساب</a>\n' +
'</aside>\n' +

/* هيدر متجر: صفّ أول فيه البحث والشعار في الوسط وزر الواتساب،
   وتحته صفّ التنقّل بعرض الصفحة. الهيدر أونيكس دائماً (v6) ويجلس في مسار
   الصفحة (sticky) — لا يطفو فوق الهيرو، فلا يحتاج حجاباً تحته. */
'<header class="header">\n' +
'  <div class="head-main">\n' +
'    <button class="burger" type="button" aria-label="فتح القائمة" aria-expanded="false" aria-controls="side">' +
       '<span></span><span></span><span></span></button>\n' +
'    <form class="search" role="search" autocomplete="off">\n' +
'      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
       '<circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.6-3.6"></path></svg>\n' +
'      <input type="search" name="q" placeholder="ابحث عن قطعة" aria-label="ابحث عن قطعة">\n' +
'      <div class="search-out" role="listbox" data-lenis-prevent hidden></div>\n' +
'    </form>\n' +
'    <a class="logo" href="' + (u || './') + '" aria-label="' + esc(D.BRAND.name) + '">' +
       '<img src="' + u + 'assets/wordmark-gold.png" alt="' + esc(D.BRAND.name) + '"></a>\n' +
/* زر الواتساب في الهيدر: كان مستطيلاً بحدود وكلمة "واتساب" وحدها في أعلى
   الصفحة، فبدا صندوقاً غريباً مقابل حقل البحث البيضاوي (ملاحظة مصطفى
   2026-07-30). صار بنفس شكل حقل البحث — نفس الحدّ ونفس الاستدارة — وبعلامة
   واتساب المعروفة قبل الكلمة، فيُقرأ الاثنان كطرفين لصفّ واحد. */
'    <a class="wa-top" href="' + wa('السلام عليكم، عندي استفسار عن مجوهرات الخميس.') + '" target="_blank" rel="noopener">' +
       '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">' +
       '<path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1s-.6.8-.7.9-.3.2-.5 0a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.3 0-.4.1-.5l.4-.5a1.8 1.8 0 0 0 .2-.4.4.4 0 0 0 0-.4c0-.1-.5-1.3-.7-1.8s-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.1 11.1 0 0 0 4.3 3.8 12 12 0 0 0 1.4.5 3.4 3.4 0 0 0 1.6.1 2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3Z"/></svg>' +
       '<span>راسلنا</span></a>\n' +
'  </div>\n' +
'  <nav class="nav" aria-label="التنقل الرئيسي">' + nav + '</nav>\n' +
'</header>\n' +

'<main id="main">\n' + o.body + '</main>\n' +

/* خانة «تواصل معنا» في آخر الموقع (بريف العميل 2026-08-02): أرقام التواصل،
   تحتها روابط السوشيال، ثم عنوان المقر.
   ⚠️ المتوفر رقم الواتساب والعنوان فقط. الحسابات لم تصل، وصفّ السوشيال
   لا يُطبع أصلاً ما دامت كلها فارغة في data/catalogue.js — أيقونة تقود
   إلى لا شيء أسوأ من غيابها. أول ما تصل الحسابات يظهر الصفّ وحده. */
'<section class="foot-contact" id="contact-block"><div class="wrap">\n' +
'  <div class="fc-head"><span class="sec-eyebrow">تواصل معنا</span>' +
'    <h2>الدار قريبة منك</h2></div>\n' +
'  <div class="fc-grid">\n' +
'    <div class="fc-card">\n' +
'      <h3>أرقام التواصل</h3>\n' +
'      <a class="fc-num" href="tel:+' + WA + '" dir="ltr">+' + WA + '</a>\n' +
'      <a class="fc-wa" href="' + wa('السلام عليكم، عندي استفسار عن مجوهرات الخميس.') + '" target="_blank" rel="noopener">' +
       '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">' +
       '<path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2z"/></svg>' +
       '<span>نفس الرقم على واتساب</span></a>\n' +
'      <p class="fc-hours">' + esc(D.BRAND.hours) + '</p>\n' +
     (SOCIAL.length
       ? '      <div class="fc-social">' + SOCIAL.map(function (x) {
           return '<a href="' + x.url + '" target="_blank" rel="noopener">' + esc(x.ar) + '</a>';
         }).join('') + '</div>\n'
       : '') +
'    </div>\n' +
'    <div class="fc-card">\n' +
'      <h3>عنوان المقر</h3>\n' +
'      <p class="fc-addr">' + esc(D.BRAND.address) + '</p>\n' +
'      <a class="fc-map" href="' + D.BRAND.maps + '" target="_blank" rel="noopener">افتح الموقع في قوقل مابس ←</a>\n' +
'    </div>\n' +
'  </div>\n' +
'</div></section>\n' +

'<footer class="footer">\n' +
'  <div class="foot-grid">\n' +
'    <div>\n' +
'      <img class="foot-logo" src="' + u + 'assets/wordmark-gold.png" alt="' + esc(D.BRAND.name) + '">\n' +
'      <p>' + esc(D.BRAND.tagline) + '</p>\n' +
'    </div>\n' +
'    <div><h4>المجوهرات</h4>' +
       D.CATEGORIES.map(function (c) {
         return '<a href="' + u + 'jewellery/' + c.slug + '">' + esc(c.ar) + '</a>';
       }).join('') + '</div>\n' +
'    <div><h4>الدار</h4>' +
'      <a href="' + u + 'about">عن الدار</a>' +
'      <a href="' + u + 'services">خدماتنا</a>' +
'      <a href="' + u + 'faq">الأسئلة الشائعة</a>' +
'      <a href="' + u + 'contact">تواصل وزيارة المعرض</a></div>\n' +
'    <div><h4>سياسات</h4>' +
'      <a href="' + u + 'policies/returns">الاستبدال والاسترجاع</a>' +
'      <a href="' + u + 'policies/shipping">الشحن والتغليف</a>' +
'      <a href="' + u + 'policies/privacy">الخصوصية</a></div>\n' +
'  </div>\n' +
'  <div class="foot-bar"><span>© ' + new Date().getFullYear() + ' ' + esc(D.BRAND.name) + '</span>' +
'    <span>من إبداع <a href="https://www.eclipseagency.net" target="_blank" rel="noopener">Eclipse Agency</a></span></div>\n' +
'</footer>\n' +

'<a class="wa-fab" href="' + wa('السلام عليكم، عندي استفسار.') + '" target="_blank" rel="noopener" aria-label="راسلنا واتساب">\n' +
'  <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.02c-.24.68-1.4 1.3-1.94 1.34-.5.04-.97.22-3.27-.68-2.76-1.09-4.5-3.9-4.64-4.08-.13-.18-1.11-1.47-1.11-2.8 0-1.34.7-2 .95-2.27.24-.27.53-.34.7-.34.18 0 .35 0 .5.01.16.01.38-.06.59.45.24.57.8 1.97.87 2.11.07.14.12.31.02.49-.09.18-.14.29-.27.45-.14.16-.29.36-.41.48-.14.14-.28.29-.12.56.16.27.72 1.18 1.54 1.91 1.06.94 1.95 1.23 2.22 1.37.27.14.43.12.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.22.6-.13.24.09 1.55.73 1.81.86.27.14.45.2.51.31.07.11.07.63-.17 1.31z"/></svg>\n' +
'</a>\n' +

'<script src="' + u + 'assets/lenis.min.js?v=' + stamp('assets/lenis.min.js') + '"></script>\n' +
'<script>\n' +
'  /* القائمة الجانبية: تُفتح من زرّ الهيدر على كل المقاسات. تحبس التركيز\n' +
'     داخلها، وتُغلق بـEscape أو بالنقر على الحجاب، وتعيد التركيز للزر،\n' +
'     وتوقف تمرير الصفحة (وLenis معها) ما دامت مفتوحة. */\n' +
'  var burger=document.querySelector(".burger"),side=document.getElementById("side"),\n' +
'      veil=document.querySelector(".side-veil"),sideX=document.querySelector(".side-x");\n' +
'  if(burger&&side&&veil){\n' +
'    var lastFocus=null;\n' +
'    function sideOpen(on){\n' +
'      side.hidden=veil.hidden=!on;\n' +
'      document.body.classList.toggle("side-on",on);\n' +
'      burger.setAttribute("aria-expanded",on?"true":"false");\n' +
'      burger.setAttribute("aria-label",on?"إغلاق القائمة":"فتح القائمة");\n' +
'      if(window.__khLenis){ if(on) window.__khLenis.stop(); else window.__khLenis.start(); }\n' +
'      if(on){ lastFocus=document.activeElement; var f=side.querySelector("a,button"); if(f)f.focus(); }\n' +
'      else if(lastFocus){ lastFocus.focus(); }\n' +
'    }\n' +
'    burger.addEventListener("click",function(){sideOpen(side.hidden);});\n' +
'    veil.addEventListener("click",function(){sideOpen(false);});\n' +
'    if(sideX)sideX.addEventListener("click",function(){sideOpen(false);});\n' +
'    document.addEventListener("keydown",function(e){\n' +
'      if(side.hidden)return;\n' +
'      if(e.key==="Escape"){sideOpen(false);return;}\n' +
'      if(e.key!=="Tab")return;\n' +
'      var f=side.querySelectorAll("a[href],button:not([disabled])");\n' +
'      if(!f.length)return;\n' +
'      var first=f[0],last=f[f.length-1];\n' +
'      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}\n' +
'      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}\n' +
'    });\n' +
'  }\n' +
'  // البحث — الفهرس من data/catalogue.js نفسه، فلا مصدر ثانٍ يتخلّف عنه\n' +
'  var IX=' + JSON.stringify(D.PIECES.map(function (p) {
     var c = D.CATEGORIES.filter(function (x) { return x.slug === p.category; })[0];
     return { t: p.ar, d: p.sub || '', u: u + 'piece/' + p.slug, c: (c ? c.ar : ''), p: priceLabel(p) };
   })) + ';\n' +
'  var sf=document.querySelector(".search"),si=sf&&sf.querySelector("input"),so=sf&&sf.querySelector(".search-out");\n' +
'  function norm(s){return (s||"").replace(/[أإآ]/g,"ا").replace(/[ىئ]/g,"ي").replace(/ة/g,"ه").replace(/[ًٌٍَُِّْ]/g,"").toLowerCase();}\n' +
'  function hits(q){q=norm(q).trim();if(!q)return [];return IX.filter(function(x){return norm(x.t+" "+x.d+" "+x.c).indexOf(q)>-1;}).slice(0,6);}\n' +
'  function draw(){\n' +
'    var r=hits(si.value);\n' +
'    if(!si.value.trim()){so.hidden=true;so.innerHTML="";return;}\n' +
'    so.hidden=false;\n' +
'    so.innerHTML=r.length?r.map(function(x){return \'<a href="\'+x.u+\'"><span>\'+x.t+(x.d?\' <i>\'+x.d+\'</i>\':\'\')+\'</span><small>\'+x.c+\' · \'+x.p+\'</small></a>\';}).join("")\n' +
'      :\'<p class="search-none">ما لقينا قطعة بهذا الاسم. <a href="' + u + 'jewellery">تصفّح كل القطع</a></p>\';\n' +
'  }\n' +
'  if(sf&&si&&so){\n' +
'    si.addEventListener("input",draw);\n' +
'    si.addEventListener("focus",draw);\n' +
'    sf.addEventListener("submit",function(e){e.preventDefault();var r=hits(si.value);location.href=r.length?r[0].u:"' + u + 'jewellery";});\n' +
'    document.addEventListener("click",function(e){if(!sf.contains(e.target)){so.hidden=true;}});\n' +
'    document.addEventListener("keydown",function(e){if(e.key==="Escape"){so.hidden=true;si.blur();}});\n' +
'  }\n' +
'  // ظهور تدريجي — يحترم تفضيل تقليل الحركة عبر CSS\n' +
'  var rv=document.querySelectorAll(".rv");\n' +
'  if(window.IntersectionObserver&&rv.length){\n' +
'    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target);}});},{rootMargin:"0px 0px -8% 0px"});\n' +
'    rv.forEach(function(el){io.observe(el);});\n' +
'  } else { rv.forEach(function(el){el.classList.add("in");}); }\n' +
'  /* تمرير ناعم — نفس محرّك furnobly.com وبنفس إعداداته: Lenis 1.1.13\n' +
'     بـ duration 1.05 وlerp 0.1. المكتبة مستضافة عندنا لا من CDN.\n' +
'     على اللمس يبقى التمرير الأصلي، ومع تفضيل تقليل الحركة لا يُفعَّل. */\n' +
'  var MQ=window.matchMedia;\n' +
'  if(window.Lenis&&MQ&&MQ("(hover:hover) and (pointer:fine)").matches&&!MQ("(prefers-reduced-motion:reduce)").matches){\n' +
'    var lx=new Lenis({duration:1.05,smoothWheel:true,lerp:0.1});\n' +
'    (function lxRaf(t){lx.raf(t);requestAnimationFrame(lxRaf);})(0);\n' +
'    window.__khLenis=lx;\n' +
'  }\n' +
'  /* بانر الرئيسية: أربع سلايدات بتلاشٍ متقاطع بالـCSS، وJS للتوقيت فقط.\n' +
'     الصورة التالية تُحمَّل قبل دورها لا مع أول فتح، والدوران يقف مع\n' +
'     تفضيل تقليل الحركة، وعند إخفاء التبويب، وعند المرور بالماوس. */\n' +
'  var hero=document.querySelector("[data-hero]");\n' +
'  if(hero){\n' +
'    var sl=hero.querySelectorAll(".hero-slide"),dots=hero.querySelectorAll(".hero-dots button"),cur=0,timer=null;\n' +
'    var still=MQ&&MQ("(prefers-reduced-motion:reduce)").matches;\n' +
'    function load(i){var im=sl[i]&&sl[i].querySelector("img[data-src]");if(im){im.src=im.getAttribute("data-src");im.removeAttribute("data-src");}}\n' +
'    function show(i){\n' +
'      if(i===cur)return;\n' +
'      load(i);\n' +
'      sl[cur].classList.remove("on");sl[i].classList.add("on");\n' +
'      sl[cur].setAttribute("aria-hidden","true");sl[cur].setAttribute("tabindex","-1");\n' +
'      sl[i].removeAttribute("aria-hidden");sl[i].removeAttribute("tabindex");\n' +
'      if(dots.length){dots[cur].classList.remove("on");dots[i].classList.add("on");\n' +
'        dots[cur].setAttribute("aria-selected","false");dots[i].setAttribute("aria-selected","true");}\n' +
'      cur=i;load((i+1)%sl.length);\n' +
'    }\n' +
'    function play(){if(still||sl.length<2)return;stop();timer=setInterval(function(){show((cur+1)%sl.length);},6500);}\n' +
'    function stop(){if(timer){clearInterval(timer);timer=null;}}\n' +
'    for(var di=0;di<dots.length;di++){(function(i){dots[i].addEventListener("click",function(){show(i);play();});})(di);}\n' +
'    hero.addEventListener("mouseenter",stop);hero.addEventListener("mouseleave",play);\n' +
'    document.addEventListener("visibilitychange",function(){document.hidden?stop():play();});\n' +
'    if(!still){ if(document.readyState==="complete")setTimeout(function(){load(1);play();},600);\n' +
'      else window.addEventListener("load",function(){setTimeout(function(){load(1);play();},600);}); }\n' +
'  }\n' +
'</script>\n' +
'</body>\n</html>\n';
}

/* ------------------------------------------------------------------ *
 * مكوّنات
 * ------------------------------------------------------------------ */
/* اسم الدار «عهد» وحده لا يقول إن القطعة خاتم. `fullName` يجمعه بوصفه
   التقني للعناوين ورسائل الواتساب والصور، والبطاقة تعرض الاثنين مفصولين
   سطراً. (اعتماد أسماء الدار: بريف العميل 2026-08-02) */
function fullName(p) { return p.sub ? p.ar + ' · ' + p.sub : p.ar; }

/* الاسم ثم خط شعري ثم السعر على سطر واحد — نمط تحريري يقرأه العين مرة واحدة. */
function pieceCard(p, depth) {
  var u = up(depth);
  return '<a class="card rv" href="' + u + 'piece/' + p.slug + '">' +
    '<span class="card-img' + (p.hover ? ' has-hover' : '') + '">' +
      '<img src="' + u + p.image + '" alt="' + esc(fullName(p)) + '" loading="lazy">' +
      (p.hover ? '<img class="card-hover" src="' + u + p.hover + '" alt="" loading="lazy">' : '') +
    '</span>' +
    '<span class="card-body">' +
      '<span class="card-top">' +
        '<span class="card-name">' + esc(p.ar) + '</span>' +
        '<span class="card-price">' + esc(priceLabel(p)) + '</span>' +
      '</span>' +
      (p.sub ? '<span class="card-sub">' + esc(p.sub) + '</span>' : '') +
      '<span class="card-meta">' + esc(metaLine(p)) + '</span>' +
    '</span></a>';
}

/* المعدن والعيار على سطر واحد. العيار قد لا يكون معتمداً بعد، فلا يُطبع
   "عيار " بلا رقم. */
function metaLine(p) {
  return [METAL[p.metal] || '', p.karat ? 'عيار ' + p.karat : ''].filter(Boolean).join(' · ');
}

function trustBar() {
  return '<section class="trust beaded"><div class="wrap"><div class="trust-row">' +
    D.TRUST.map(function (t) {
      return '<div class="rv"><strong>' + esc(t.ar) + '</strong><span>' + esc(t.hint) + '</span></div>';
    }).join('') + '</div></div></section>';
}

/* شريط متحرك — يعطي إحساساً بالحياة بلا صخب.
   الفواصل معلَّمة aria-hidden: هي زخرفة بصرية، وقارئ الشاشة كان ينطق
   «نجمة» بين كل عبارتين. وتأخذ لوناً ذهبياً باهتاً عبر CSS. */
function marquee() {
  var words = ['ألماس موثّق بشهاداته', 'صياغة يدوية في ورشة الدار',
               'تصميم خاص حسب الطلب', 'ضمان الدار على كل قطعة',
               'تغليف الدار جاهزاً للإهداء'];
  var run = words.map(function (w) {
    return '<span>' + esc(w) + '</span><span aria-hidden="true">◆</span>';
  }).join('');
  return '<div class="marquee"><div class="marquee-in">' + run + run + '</div></div>';
}

function ctaBand(depth) {
  return '<section class="cta">' +
    '<img class="cta-bg" src="' + up(depth) + 'assets/editorial/cta-bracelets.jpg" alt="" loading="lazy">' +
    '<div class="wrap">' +
    '<h2>قطعة في خيالك، نصوغها لك</h2>' +
    '<p>صف لنا ما تريد، أو احجز زيارة للمعرض وترى القطع على الطبيعة.</p>' +
    '<div class="cta-acts">' +
      '<a class="btn btn-gold" href="' + wa('السلام عليكم، أبحث عن قطعة معينة.') + '" target="_blank" rel="noopener">تواصل عبر واتساب</a>' +
      '<a class="btn btn-ghost" href="' + up(depth) + 'contact">زيارة المعرض</a>' +
    '</div></div></section>';
}

/* ------------------------------------------------------------------ *
 * الصفحات
 * ------------------------------------------------------------------ */
function home() {
  /* أربع قطع لا خمس: الشبكة صارت أربعة أعمدة (2026-07-30) فالخامسة كانت
     تسقط وحدها في صفّ ثانٍ وتترك ثلاثة أعمدة فارغة — وهو ما كان يظهر
     فعلاً على الرئيسية. العدد يتبع الشبكة: مضاعفات الأربعة وحدها. */
  var featured = D.PIECES.slice(0, 4);
  return layout({
    title: 'دار مجوهرات', active: '', depth: 0,
    description: D.BRAND.name + ' — ذهب وألماس موثّق، صياغة يدوية، وتصميم خاص حسب الطلب.',
    body:
/* الهيرو: صورة خلفية والنص فوقها، بحجاب أونيكس يثقل من جهة النص (v6). */
/* الهيرو: أربع سلايدات تتبدّل تلقائياً خلف جملة ثابتة (بريف 2026-08-02).
   الصورة الأولى وحدها eager وبأولوية عالية — هي الـLCP؛ والثلاث الباقية
   بلا src وتُحمَّل من JS بعد استقرار الصفحة، فأربع صور لا تعني أربعة
   أحمال في أول فتح. */
'<section class="hero" data-hero>\n' +
   D.HERO.slides.map(function (sl, i) {
     return '  <a class="hero-slide' + (i === 0 ? ' on' : '') + '" href="jewellery/' + sl.cat + '"' +
       ' aria-label="' + esc(sl.ar) + '"' + (i === 0 ? '' : ' tabindex="-1" aria-hidden="true"') + '>' +
       '<img class="hero-bg"' + (i === 0
         ? ' src="' + sl.image + '" fetchpriority="high"'
         : ' data-src="' + sl.image + '" loading="lazy"') +
       ' alt=""></a>\n';
   }).join('') +
'  <div class="hero-in"><div class="hero-copy">\n' +
'    <span class="hero-eyebrow">دار مجوهرات · العليا، الرياض</span>\n' +
'    <h1>' + esc(D.HERO.title) + '</h1>\n' +
'    <i class="hero-rule"></i>\n' +
'    <div class="hero-row">\n' +
'      <p>' + esc(D.HERO.lead) + '</p>\n' +
'      <div class="hero-acts">\n' +
'        <a class="btn btn-gold" href="jewellery">تصفّح المجموعات</a>\n' +
'        <a class="more" href="services">التصميم الخاص ←</a>\n' +
'      </div>\n' +
'    </div>\n' +
'  </div></div>\n' +
'  <div class="hero-dots" role="tablist" aria-label="أقسام البانر">' +
   D.HERO.slides.map(function (sl, i) {
     return '<button type="button" role="tab" aria-selected="' + (i === 0 ? 'true' : 'false') + '"' +
       ' aria-label="' + esc(sl.ar) + '"' + (i === 0 ? ' class="on"' : '') + '><span>' + esc(sl.ar) + '</span></button>';
   }).join('') + '</div>\n' +
'  <div class="scroll-cue"><span>مرّر</span><i></i></div>\n' +
'</section>\n' +

marquee() +
trustBar() +

/* الفئات: شريط من بلاطات كبيرة، اسم الفئة عليها بحجم يُقرأ من بعيد.
   كانت صورة واحدة يقابلها صفّ نحيل لكل فئة، فلم يكن واضحاً أن هذه هي
   الفئات أصلاً (ملاحظة مصطفى 2026-07-30). البلاطة الآن هي الرابط. */
'<section class="section"><div class="wrap">\n' +
'  <div class="sec-head rv"><span class="sec-eyebrow">الأقسام</span>' +
'    <div class="sec-top"><h2>مجموعات الدار</h2>' +
'    <a class="more" href="jewellery">عرض الكل ←</a></div></div>\n' +
'</div>\n' +
'<div class="cat-band rv" style="--n:' + D.CATEGORIES.length + '">' + D.CATEGORIES.map(function (c) {
   var n = piecesIn(c.slug).length;
   return '<a class="cat-tile" href="jewellery/' + c.slug + '">' +
     '<span class="cat-tile-img"><img src="' + c.image + '" alt="' + esc(c.ar) + '" loading="lazy"></span>' +
     '<span class="cat-tile-in">' +
       '<h3>' + esc(c.ar) + '</h3>' +
       '<em>' + (n === 1 ? 'قطعة واحدة' : n === 2 ? 'قطعتان' : n + ' قطع') + '</em>' +
     '</span></a>';
 }).join('') + '</div>\n' +
'</section>\n' +

/* قطع المعرض: البلاطات عاجية على الأونيكس، فهذا هو الشريط الفاتح الذي
   يمنع الصفحة من أن تصير كتلة سوداء واحدة. */
'<section class="section on-light"><div class="wrap">\n' +
'  <div class="sec-head rv"><span class="sec-eyebrow">في المعرض الآن</span>' +
'    <div class="sec-top"><h2>قطعٌ تراها وتقيسها اليوم</h2><a class="more" href="jewellery">عرض الكل ←</a></div></div>\n' +
'  <div class="grid">' + featured.map(function (p) { return pieceCard(p, 0); }).join('') + '</div>\n' +
'</div></section>\n' +

'<section class="section"><div class="wrap">\n' +
'  <div class="sec-head rv"><span class="sec-eyebrow">المناسبات</span>' +
'    <h2>لكل مناسبة قطعتها</h2><p>أخبرنا بالمناسبة والميزانية، فنرشّح لك ثلاث قطع تليق بها — بدلاً من تقليب الكتالوج كله.</p></div>\n' +
'  <div class="occ-row rv">' + D.OCCASIONS.map(function (o) {
     return '<a class="occ" href="occasions/' + o.slug + '">' +
       '<img src="' + o.image + '" alt="" loading="lazy"><span>' + esc(o.ar) + '</span></a>';
   }).join('') + '</div>\n' +
'</div></section>\n' +

ctaBand(0)
  });
}

function jewellery() {
  return layout({
    title: 'المجوهرات', active: 'jewellery', depth: 0,
    description: 'تصفّح خواتم وقلائد وأساور وأقراط وأطقم مجوهرات الخميس.',
    body:
'<section class="page-head"><div class="wrap"><h1>المجوهرات</h1>' +
'<p>' + D.PIECES.length + ' قطعة · اختر الفئة أو تصفّح الكل.</p></div></section>\n' +
'<section class="section"><div class="wrap">\n' +
'  <div class="chips"><a class="chip on" href="jewellery">الكل</a>' +
   D.CATEGORIES.map(function (c) {
     return '<a class="chip" href="jewellery/' + c.slug + '">' + esc(c.ar) + '</a>';
   }).join('') + '</div>\n' +
'  <div class="grid">' + D.PIECES.map(function (p) { return pieceCard(p, 0); }).join('') + '</div>\n' +
'</div></section>\n' + ctaBand(0)
  });
}

function categoryPage(c) {
  var list = piecesIn(c.slug);
  var metals = {};
  list.forEach(function (p) { metals[p.metal] = true; });
  return layout({
    title: c.ar, active: 'jewellery', depth: 1,
    description: c.ar + ' من مجوهرات الخميس — ' + c.hint,
    body:
'<section class="page-head"><div class="wrap">' +
'<nav class="crumb"><a href="../">الرئيسية</a> · <a href="../jewellery">المجوهرات</a> · <span>' + esc(c.ar) + '</span></nav>' +
'<h1>' + esc(c.ar) + '</h1><p>' + esc(c.hint) + '</p></div></section>\n' +
'<section class="section"><div class="wrap">\n' +
'  <div class="chips"><a class="chip" href="../jewellery">الكل</a>' +
   D.CATEGORIES.map(function (x) {
     return '<a class="chip' + (x.slug === c.slug ? ' on' : '') + '" href="' + x.slug + '">' + esc(x.ar) + '</a>';
   }).join('') + '</div>\n' +
   (Object.keys(metals).length > 1
     ? '<p class="metal-note">متوفر بـ ' + Object.keys(metals).map(function (m) { return esc(METAL[m]); }).join(' · ') + '</p>'
     : '') +
'  <div class="grid">' + (list.length
     ? list.map(function (p) { return pieceCard(p, 1); }).join('')
     : '<p class="empty">قطع هذه الفئة تُضاف مع اعتماد الكتالوج. راسلنا وقول لنا وش تدور عليه.</p>') + '</div>\n' +
'</div></section>\n' + ctaBand(1)
  });
}

/* صفحة القطعة — الغرض منها إعطاء ثقة كافية ليراسل العميل وهو جاد. */
function piecePage(p) {
  var c = CAT[p.category] || {};
  var msg = 'السلام عليكم، مهتم بـ' + fullName(p) + ' (رقم ' + p.ref + '). ممكن التفاصيل والسعر؟';
  var specs = [
    ['الفئة', c.ar],
    ['المعدن', METAL[p.metal]],
    ['العيار', p.karat ? 'عيار ' + p.karat : ''],
    ['الوزن التقريبي', p.weight ? p.weight + ' جم' : ''],
    ['الحجر', p.stone],
    ['المقاسات المتاحة', p.sizes],
    ['الشهادة', p.certified ? 'شهادة معتمدة تُسلّم مع القطعة' : ''],
    ['التنفيذ', p.madeToOrder ? 'تُصنع بالطلب — نتفق على المدة قبل البدء' : 'متوفرة في المعرض']
  ].filter(function (r) { return r[1]; });

  var related = D.PIECES.filter(function (x) {
    return x.category === p.category && x.slug !== p.slug;
  }).slice(0, 3);

  return layout({
    title: fullName(p), active: 'jewellery', depth: 1,
    description: fullName(p) + ' — ' + metaLine(p) + '. ' + (p.note || ''),
    body:
'<section class="piece"><div class="wrap piece-grid">\n' +
'  <div class="piece-media rv' + (p.hover ? ' has-hover' : '') + '">' +
     '<img src="../' + p.image + '" alt="' + esc(p.ar) + '">' +
     (p.hover ? '<img class="card-hover" src="../' + p.hover + '" alt="' + esc(fullName(p)) + ' على الموديل" loading="lazy">' : '') +
   '</div>\n' +
'  <div class="piece-info">\n' +
'    <nav class="crumb"><a href="../">الرئيسية</a> · <a href="../jewellery">المجوهرات</a> · ' +
       '<a href="../jewellery/' + p.category + '">' + esc(c.ar) + '</a></nav>\n' +
'    <h1>' + esc(p.ar) + '</h1>\n' +
     (p.sub ? '<p class="piece-sub">' + esc(p.sub) + '</p>\n' : '') +
'    <div class="piece-ref">رقم القطعة: <b>' + esc(p.ref) + '</b></div>\n' +
'    <div class="piece-price">' + esc(priceLabel(p)) + '</div>\n' +
     (p.note ? '<p class="piece-note">' + esc(p.note) + '</p>' : '') +
'    <a class="btn btn-wa btn-block" href="' + wa(msg) + '" target="_blank" rel="noopener">' +
       'اسأل عن هذه القطعة على واتساب</a>\n' +
'    <p class="piece-hint">الرسالة تفتح باسم القطعة ورقمها، فيعرف الموظف عن أي قطعة تسأل من أول سطر.</p>\n' +
'    <dl class="specs">' + specs.map(function (r) {
       return '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>';
     }).join('') + '</dl>\n' +
'    <a class="piece-visit" href="../contact">أو زر المعرض وشوفها على الطبيعة ←</a>\n' +
'  </div>\n' +
'</div></section>\n' +
(related.length
  ? '<section class="section on-light"><div class="wrap">' +
    '<div class="sec-head rv"><span class="sec-eyebrow">من المجموعة نفسها</span><h2>قطعٌ مشابهة</h2></div>' +
    '<div class="grid grid-related">' + related.map(function (x) { return pieceCard(x, 1); }).join('') + '</div>' +
    '</div></section>'
  : '')
  });
}

function occasions() {
  return layout({
    title: 'المناسبات', active: 'occasions', depth: 0,
    description: 'مجموعات مختارة لكل مناسبة من مجوهرات الخميس.',
    body:
'<section class="page-head"><div class="wrap"><h1>المناسبات</h1>' +
'<p>أغلب الناس يشترون لمناسبة، لا لقطعة بعينها. اختر المناسبة ونبسّط لك القرار.</p></div></section>\n' +
'<section class="section"><div class="wrap"><div class="occ-cards">' +
 D.OCCASIONS.map(function (o) {
   return '<a class="occ-card rv" href="occasions/' + o.slug + '">' +
     '<img src="' + o.image + '" alt="" loading="lazy">' +
     '<div><h3>' + esc(o.ar) + '</h3><p>' + esc(o.lead) + '</p><span>شوف المجموعة ←</span></div></a>';
 }).join('') + '</div></div></section>\n' + ctaBand(0)
  });
}

function occasionPage(o) {
  var list = piecesFor(o.slug);
  return layout({
    title: o.ar, active: 'occasions', depth: 1,
    description: o.ar + ' — ' + o.lead,
    body:
'<section class="page-head"><div class="wrap">' +
'<nav class="crumb"><a href="../">الرئيسية</a> · <a href="../occasions">المناسبات</a> · <span>' + esc(o.ar) + '</span></nav>' +
'<h1>' + esc(o.ar) + '</h1><p>' + esc(o.lead) + '</p></div></section>\n' +
'<section class="section"><div class="wrap">' +
'  <div class="guide">' + esc(o.guide) + '</div>\n' +
'  <div class="grid">' + (list.length
     ? list.map(function (p) { return pieceCard(p, 1); }).join('')
     : '<p class="empty">راسلنا وقول لنا عن المناسبة والميزانية، ونرشّح لك.</p>') + '</div>\n' +
'</div></section>\n' + ctaBand(1)
  });
}

function services() {
  return layout({
    title: 'خدماتنا', active: 'services', depth: 0,
    description: 'تصميم خاص، صيانة وتلميع، تغيير المقاس، والتقييم وإعادة الشراء.',
    body:
'<section class="page-head"><div class="wrap"><h1>خدماتنا</h1>' +
'<p>' + esc(D.SERVICES_LEAD) + '</p></div></section>\n' +
'<section class="section"><div class="wrap"><div class="svc-grid">' +
 D.SERVICES.map(function (s) {
   return '<article class="svc rv"><span class="svc-ic">' + s.icon + '</span>' +
     '<h3>' + esc(s.ar) + '</h3><p>' + esc(s.body) + '</p>' +
     '<a href="' + wa('السلام عليكم، أبي أستفسر عن خدمة ' + s.ar + '.') + '" target="_blank" rel="noopener">اسأل عن الخدمة ←</a>' +
     '</article>';
 }).join('') + '</div></div></section>\n' + marquee() + ctaBand(0)
  });
}

function about() {
  return layout({
    title: 'عن الدار', active: 'about', depth: 0,
    description: D.ABOUT.lead,
    body:
'<section class="page-head"><div class="wrap"><h1>عن الدار</h1><p>' + esc(D.ABOUT.lead) + '</p></div></section>\n' +
'<section class="section"><div class="wrap about-grid">' +
'  <div class="about-copy rv">' + D.ABOUT.body.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') + '</div>' +
'  <div class="about-media rv"><img src="assets/model-gold.jpg" alt="" loading="lazy"></div>' +
'</div></section>\n' + trustBar() + ctaBand(0)
  });
}

function faq() {
  return layout({
    title: 'الأسئلة الشائعة', active: 'faq', depth: 0,
    description: 'الضمان والاستبدال والشحن والشهادات ومدة التصميم الخاص.',
    body:
'<section class="page-head"><div class="wrap"><h1>الأسئلة الشائعة</h1>' +
'<p>إذا لم تجد إجابة على استفسارك، تواصل معنا عبر واتساب وسنكون سعداء بمساعدتك.</p></div></section>\n' +
'<section class="section"><div class="wrap faq-list">' +
 D.FAQ.map(function (f) {
   return '<details class="rv"><summary>' + esc(f.q) + '</summary><p>' + esc(f.a) + '</p></details>';
 }).join('') + '</div></section>\n' + ctaBand(0)
  });
}

function contact() {
  return layout({
    title: 'تواصل وزيارة المعرض', active: 'contact', depth: 0,
    description: 'عنوان المعرض وأوقات العمل والتواصل المباشر عبر واتساب.',
    body:
'<section class="page-head"><div class="wrap"><h1>تواصل وزيارة المعرض</h1>' +
'<p>راسلنا على واتساب، أو زرنا في المعرض وشوف القطع على الطبيعة.</p></div></section>\n' +
'<section class="section"><div class="wrap contact-grid">\n' +
'  <div class="contact-card rv">\n' +
'    <a class="btn btn-wa btn-block" href="' + wa('السلام عليكم، عندي استفسار.') + '" target="_blank" rel="noopener">راسلنا على واتساب</a>\n' +
'    <div class="c-row"><span>العنوان</span><b>' + esc(D.BRAND.address) + '</b></div>\n' +
'    <div class="c-row"><span>أوقات العمل</span><b>' + esc(D.BRAND.hours) + '</b></div>\n' +
'    <a class="btn btn-ghost btn-block" href="' + D.BRAND.maps + '" target="_blank" rel="noopener">افتح الموقع في قوقل مابس</a>\n' +
'  </div>\n' +
'  <div class="contact-media rv"><img src="assets/necklace-box.jpg" alt="" loading="lazy"></div>\n' +
'</div></section>\n'
  });
}

function policy(slug, title, paras) {
  return layout({
    title: title, active: '', depth: 1,
    description: title + ' — ' + D.BRAND.name,
    body:
'<section class="page-head"><div class="wrap">' +
'<nav class="crumb"><a href="../">الرئيسية</a> · <span>' + esc(title) + '</span></nav>' +
'<h1>' + esc(title) + '</h1></div></section>\n' +
'<section class="section"><div class="wrap prose">' +
 paras.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') +
'<p class="prose-note">للاستفسار عن أي بند، راسلنا على ' +
'<a href="' + wa('السلام عليكم، عندي سؤال عن ' + title + '.') + '" target="_blank" rel="noopener">واتساب</a>.</p>' +
'</div></section>\n'
  });
}

/* ------------------------------------------------------------------ *
 * الكتابة
 * ------------------------------------------------------------------ */
function write(rel, html) {
  if (/\.html$/.test(rel)) {
    /* بصمة كل صورة من محتواها: الصورة المعدّلة باسمها القديم تصل للزائر. */
    html = html.replace(/(assets\/catalogue\/[a-z0-9-]+\.jpg)/g, function (m) {
      return m + '?v=' + stamp(m);
    });
  }
  var full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, html, 'utf8');
  return rel;
}

var written = [];
written.push(write('index.html', home()));
written.push(write('jewellery.html', jewellery()));
D.CATEGORIES.forEach(function (c) { written.push(write('jewellery/' + c.slug + '.html', categoryPage(c))); });
D.PIECES.forEach(function (p) { written.push(write('piece/' + p.slug + '.html', piecePage(p))); });
written.push(write('occasions.html', occasions()));
D.OCCASIONS.forEach(function (o) { written.push(write('occasions/' + o.slug + '.html', occasionPage(o))); });
written.push(write('services.html', services()));
written.push(write('about.html', about()));
written.push(write('faq.html', faq()));
written.push(write('contact.html', contact()));

/* نصوص السياسات — نصّ العميل المعتمد 2026-08-02 حرفياً. */
written.push(write('policies/returns.html', policy('returns', 'الاستبدال والاسترجاع', [
  'نحرص على تقديم تجربة شراء مريحة وموثوقة. يمكن طلب الاستبدال خلال الفترة المحددة من تاريخ الشراء، بشرط أن تكون القطعة بحالتها الأصلية، مرفقة بالفاتورة والتغليف الخاص بالدار.',
  'أما القطع المصمّمة حسب الطلب أو المعدّلة خصيصاً بالمقاس، فتخضع لشروط خاصة يتم توضيحها والاتفاق عليها معك قبل بدء التنفيذ.',
  'لأي استفسار أو طلب استبدال، تواصل معنا وسنساعدك في إتمام الإجراء المناسب بكل سهولة.'
])));
written.push(write('policies/shipping.html', policy('shipping', 'الشحن والتغليف', [
  'نحرص على أن تصل قطعتك إليك بنفس العناية التي صُنعت بها. نوفّر الشحن داخل المملكة العربية السعودية مع تغليف آمن وأنيق يليق بقيمة القطعة ويجعلها جاهزة للإهداء.',
  'تختلف مدة التوصيل حسب المدينة وتوفّر القطعة، كما قد تختلف للقطع المصمّمة حسب الطلب نظراً لكونها تُنفَّذ بعناية خاصة.',
  'للتأكد من تفاصيل الشحن ومدة التوصيل لمدينتك، تواصل معنا قبل إتمام الطلب.'
])));
written.push(write('policies/privacy.html', policy('privacy', 'سياسة الخصوصية', [
  'هذا الموقع واجهة عرض. لا يطلب منك إنشاء حساب، ولا يجمع بيانات دفع، ولا يحتفظ ببيانات شخصية عنك.',
  'التواصل يتم عبر واتساب، وتخضع المحادثة لسياسة خصوصية واتساب نفسها.',
  'أي بيانات تشاركها معنا في المحادثة تُستخدم لخدمة طلبك فقط.'
])));

/* sitemap.xml — يتولد بعد ثبات الهيكل، كما نصّ docs/sitemap.md */
var origin = 'https://alkhamees-jewellery.vercel.app';
var urls = written
  .filter(function (f) { return f.indexOf('policies/') !== 0; })
  .map(function (f) {
    var u = f.replace(/index\.html$/, '').replace(/\.html$/, '');
    return origin + '/' + u;
  });
write('sitemap.xml',
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(function (u) { return '  <url><loc>' + u + '</loc></url>'; }).join('\n') +
  '\n</urlset>\n');
write('robots.txt', 'User-agent: *\nAllow: /\n\nSitemap: ' + origin + '/sitemap.xml\n');

console.log('بُني ' + written.length + ' صفحة + sitemap.xml + robots.txt:');
written.forEach(function (f) { console.log('  ' + f); });
console.log('\nرقم الواتساب المستخدم: ' + WA + '  (من data/catalogue.js)');
