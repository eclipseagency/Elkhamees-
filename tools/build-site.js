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
var D = require('../data/catalogue.js');

var ROOT = path.join(__dirname, '..');
var WA = D.BRAND.whatsapp;

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
'<meta name="theme-color" content="#0d0c0b">\n' +
'<meta property="og:title" content="' + esc(o.title) + ' · ' + esc(D.BRAND.name) + '">\n' +
'<meta property="og:description" content="' + esc(o.description || D.BRAND.tagline) + '">\n' +
'<meta property="og:type" content="website">\n' +
'<link rel="icon" href="' + u + 'assets/monogram.svg">\n' +
'<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
'<link href="https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&family=Tajawal:wght@300;400;500;700&display=swap" rel="stylesheet">\n' +
'<link rel="stylesheet" href="' + u + 'assets/site.css">\n' +
'</head>\n<body>\n' +

'<div class="top">صناعة سعودية · ذهب وألماس موثّق · زيارة المعرض بموعد</div>\n' +

'<header class="header">\n' +
'  <button class="burger" type="button" aria-label="القائمة" aria-expanded="false">☰</button>\n' +
'  <a class="logo" href="' + (u || './') + '" aria-label="' + esc(D.BRAND.name) + '">' +
     '<img src="' + u + 'assets/wordmark-cream.png" alt="' + esc(D.BRAND.name) + '"></a>\n' +
'  <nav class="nav" aria-label="التنقل الرئيسي">' + nav + '</nav>\n' +
'  <a class="wa-top" href="' + wa('السلام عليكم، عندي استفسار عن مجوهرات الخميس.') + '" target="_blank" rel="noopener">واتساب</a>\n' +
'</header>\n' +

'<main id="main">\n' + o.body + '</main>\n' +

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
'      <a href="' + u + 'policies/returns">الاستبدال والإرجاع</a>' +
'      <a href="' + u + 'policies/shipping">الشحن والتغليف</a>' +
'      <a href="' + u + 'policies/privacy">الخصوصية</a></div>\n' +
'  </div>\n' +
'  <div class="foot-bar"><span>© ' + new Date().getFullYear() + ' ' + esc(D.BRAND.name) + '</span>' +
'    <span>من إبداع <a href="https://www.eclipseagency.net" target="_blank" rel="noopener">Eclipse Agency</a></span></div>\n' +
'</footer>\n' +

'<a class="wa-fab" href="' + wa('السلام عليكم، عندي استفسار.') + '" target="_blank" rel="noopener" aria-label="راسلنا واتساب">\n' +
'  <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.02c-.24.68-1.4 1.3-1.94 1.34-.5.04-.97.22-3.27-.68-2.76-1.09-4.5-3.9-4.64-4.08-.13-.18-1.11-1.47-1.11-2.8 0-1.34.7-2 .95-2.27.24-.27.53-.34.7-.34.18 0 .35 0 .5.01.16.01.38-.06.59.45.24.57.8 1.97.87 2.11.07.14.12.31.02.49-.09.18-.14.29-.27.45-.14.16-.29.36-.41.48-.14.14-.28.29-.12.56.16.27.72 1.18 1.54 1.91 1.06.94 1.95 1.23 2.22 1.37.27.14.43.12.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.22.6-.13.24.09 1.55.73 1.81.86.27.14.45.2.51.31.07.11.07.63-.17 1.31z"/></svg>\n' +
'</a>\n' +

'<script>\n' +
'  // القائمة على الجوال — سطران، بلا مكتبة\n' +
'  var b=document.querySelector(".burger"),n=document.querySelector(".nav");\n' +
'  if(b&&n)b.addEventListener("click",function(){var o=n.classList.toggle("open");b.setAttribute("aria-expanded",o?"true":"false");});\n' +
'</script>\n' +
'</body>\n</html>\n';
}

/* ------------------------------------------------------------------ *
 * مكوّنات
 * ------------------------------------------------------------------ */
function pieceCard(p, depth) {
  var u = up(depth);
  return '<a class="card" href="' + u + 'piece/' + p.slug + '">' +
    '<span class="card-img"><img src="' + u + p.image + '" alt="' + esc(p.ar) + '" loading="lazy"></span>' +
    '<span class="card-body">' +
      '<span class="card-name">' + esc(p.ar) + '</span>' +
      '<span class="card-meta">' + esc(METAL[p.metal] || '') + ' · عيار ' + esc(p.karat) + '</span>' +
      '<span class="card-price">' + esc(priceLabel(p)) + '</span>' +
    '</span></a>';
}

function trustBar() {
  return '<section class="trust"><div class="wrap trust-row">' +
    D.TRUST.map(function (t) {
      return '<div><strong>' + esc(t.ar) + '</strong><span>' + esc(t.hint) + '</span></div>';
    }).join('') + '</div></section>';
}

function ctaBand(depth) {
  return '<section class="cta"><div class="wrap">' +
    '<h2>ما لقيت اللي تبيه؟</h2>' +
    '<p>راسلنا ووصف لنا القطعة، أو احجز زيارة للمعرض وشوفها بنفسك.</p>' +
    '<div class="cta-acts">' +
      '<a class="btn btn-gold" href="' + wa('السلام عليكم، أبحث عن قطعة معينة.') + '" target="_blank" rel="noopener">راسلنا واتساب</a>' +
      '<a class="btn btn-ghost" href="' + up(depth) + 'contact">زيارة المعرض</a>' +
    '</div></div></section>';
}

/* ------------------------------------------------------------------ *
 * الصفحات
 * ------------------------------------------------------------------ */
function home() {
  var featured = D.PIECES.slice(0, 4);
  return layout({
    title: 'دار مجوهرات', active: '', depth: 0,
    description: D.BRAND.name + ' — ذهب وألماس موثّق، صياغة يدوية، وتصميم خاص حسب الطلب.',
    body:
'<section class="hero">\n' +
'  <img class="hero-img" src="assets/concept-v2/campaign-hero.jpg" alt="" fetchpriority="high">\n' +
'  <div class="hero-copy">\n' +
'    <span class="eyebrow">مجوهرات الخميس</span>\n' +
'    <h1>قطعة تُلبس لسنوات،<br>لا لموسم</h1>\n' +
'    <p>ذهب وألماس موثّق، صياغة يدوية في ورشتنا، وتصميم خاص لو ما لقيت اللي في بالك.</p>\n' +
'    <div class="hero-acts">\n' +
'      <a class="btn btn-gold" href="jewellery">تصفّح المجوهرات</a>\n' +
'      <a class="btn btn-ghost" href="occasions">أشتري لمناسبة</a>\n' +
'    </div>\n' +
'  </div>\n' +
'</section>\n' +

trustBar() +

'<section class="section"><div class="wrap">\n' +
'  <div class="sec-head"><h2>ادخل من هنا</h2><p>اختر الفئة اللي تدور عليها.</p></div>\n' +
'  <div class="cats">' + D.CATEGORIES.map(function (c) {
     return '<a class="cat" href="jewellery/' + c.slug + '">' +
       '<img src="' + c.image + '" alt="" loading="lazy">' +
       '<span><strong>' + esc(c.ar) + '</strong><em>' + esc(c.hint) + '</em></span></a>';
   }).join('') + '</div>\n' +
'</div></section>\n' +

'<section class="section section-alt"><div class="wrap">\n' +
'  <div class="sec-head"><h2>مختارات</h2><a class="more" href="jewellery">كل القطع ←</a></div>\n' +
'  <div class="grid">' + featured.map(function (p) { return pieceCard(p, 0); }).join('') + '</div>\n' +
'</div></section>\n' +

'<section class="section"><div class="wrap">\n' +
'  <div class="sec-head"><h2>تشتري لمناسبة؟</h2><p>اختر المناسبة ونرشّح لك.</p></div>\n' +
'  <div class="occ-row">' + D.OCCASIONS.map(function (o) {
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
  var msg = 'السلام عليكم، مهتم بـ' + p.ar + ' (رقم ' + p.ref + '). ممكن التفاصيل والسعر؟';
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
    title: p.ar, active: 'jewellery', depth: 1,
    description: p.ar + ' — ' + (METAL[p.metal] || '') + ' عيار ' + p.karat + '. ' + (p.note || ''),
    body:
'<section class="piece"><div class="wrap piece-grid">\n' +
'  <div class="piece-media"><img src="../' + p.image + '" alt="' + esc(p.ar) + '"></div>\n' +
'  <div class="piece-info">\n' +
'    <nav class="crumb"><a href="../">الرئيسية</a> · <a href="../jewellery">المجوهرات</a> · ' +
       '<a href="../jewellery/' + p.category + '">' + esc(c.ar) + '</a></nav>\n' +
'    <h1>' + esc(p.ar) + '</h1>\n' +
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
  ? '<section class="section section-alt"><div class="wrap">' +
    '<div class="sec-head"><h2>قطع مشابهة</h2></div>' +
    '<div class="grid">' + related.map(function (x) { return pieceCard(x, 1); }).join('') + '</div>' +
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
   return '<a class="occ-card" href="occasions/' + o.slug + '">' +
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
'<p>الدار ما هي بيع فقط. هذي الخدمات اللي نقدمها لقطعك، سواء اشتريتها منا أو لا.</p></div></section>\n' +
'<section class="section"><div class="wrap"><div class="svc-grid">' +
 D.SERVICES.map(function (s) {
   return '<article class="svc"><span class="svc-ic">' + s.icon + '</span>' +
     '<h3>' + esc(s.ar) + '</h3><p>' + esc(s.body) + '</p>' +
     '<a href="' + wa('السلام عليكم، أبي أستفسر عن خدمة ' + s.ar + '.') + '" target="_blank" rel="noopener">اسأل عن الخدمة ←</a>' +
     '</article>';
 }).join('') + '</div></div></section>\n' + ctaBand(0)
  });
}

function about() {
  return layout({
    title: 'عن الدار', active: 'about', depth: 0,
    description: D.ABOUT.lead,
    body:
'<section class="page-head"><div class="wrap"><h1>عن الدار</h1><p>' + esc(D.ABOUT.lead) + '</p></div></section>\n' +
'<section class="section"><div class="wrap about-grid">' +
'  <div class="about-copy">' + D.ABOUT.body.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') + '</div>' +
'  <div class="about-media"><img src="assets/model-gold.jpg" alt="" loading="lazy"></div>' +
'</div></section>\n' + trustBar() + ctaBand(0)
  });
}

function faq() {
  return layout({
    title: 'الأسئلة الشائعة', active: 'faq', depth: 0,
    description: 'الضمان والاستبدال والشحن والشهادات ومدة التصميم الخاص.',
    body:
'<section class="page-head"><div class="wrap"><h1>الأسئلة الشائعة</h1>' +
'<p>لو ما لقيت جوابك، راسلنا واتساب وبنرد عليك.</p></div></section>\n' +
'<section class="section"><div class="wrap faq-list">' +
 D.FAQ.map(function (f) {
   return '<details><summary>' + esc(f.q) + '</summary><p>' + esc(f.a) + '</p></details>';
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
'  <div class="contact-card">\n' +
'    <a class="btn btn-wa btn-block" href="' + wa('السلام عليكم، عندي استفسار.') + '" target="_blank" rel="noopener">راسلنا على واتساب</a>\n' +
'    <div class="c-row"><span>العنوان</span><b>' + esc(D.BRAND.address) + '</b></div>\n' +
'    <div class="c-row"><span>أوقات العمل</span><b>' + esc(D.BRAND.hours) + '</b></div>\n' +
'    <a class="btn btn-ghost btn-block" href="' + D.BRAND.maps + '" target="_blank" rel="noopener">افتح الموقع في قوقل مابس</a>\n' +
'  </div>\n' +
'  <div class="contact-media"><img src="assets/necklace-box.jpg" alt="" loading="lazy"></div>\n' +
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

written.push(write('policies/returns.html', policy('returns', 'الاستبدال والإرجاع', [
  'نستقبل طلبات الاستبدال خلال المدة المعتمدة من تاريخ الشراء، بشرط أن تكون القطعة بحالتها الأصلية ومعها الفاتورة وتغليف الدار.',
  'القطع المصنوعة بالطلب أو المعدّلة بالمقاس لها شروط خاصة نوضحها لك قبل بدء التنفيذ، حتى تكون على علم قبل الاتفاق.',
  'لأي حالة، راسلنا أولاً ونرتّب لك الإجراء المناسب.'
])));
written.push(write('policies/shipping.html', policy('shipping', 'الشحن والتغليف', [
  'الشحن متاح داخل المملكة العربية السعودية، بتغليف مؤمّن يليق بالقطعة وجاهز للإهداء.',
  'مدة التوصيل تختلف حسب المدينة وحسب توفر القطعة أو كونها تُصنع بالطلب.',
  'راسلنا لتأكيد تفاصيل الشحن لمدينتك قبل الطلب.'
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
