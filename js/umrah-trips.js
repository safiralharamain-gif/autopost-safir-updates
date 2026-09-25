
// SAFIR AL HARAMAIN - Umrah hub v2
(function () {
  "use strict";

  var tripsContainer = document.querySelector(".new-umrah-trip");

  async function renderCurrentTrips() {
    if (!tripsContainer || typeof db === "undefined") return;
    try {
      var trips = [];
      var category = await db.collection("trips").where("category", "==", "umrah-2").get();
      category.forEach(function (cat) {
        var obj = cat.data();
        obj.id = String(cat.id);
        trips.push(obj);
      });
      trips.sort(function (a, b) { return (a.sort || 0) - (b.sort || 0); });
      tripsContainer.innerHTML = trips.map(function (product) {
        return '<div class="col p-lg-4 py-3">' +
          '<img src="./img/umrah-imgs/' + product.imgs + '" class="rounded-4 shadow safir-trip-image" alt="برنامج عمرة" width="100%" loading="lazy">' +
          '<button onclick="getID(\'' + product.id + '\')" class="btn-primary border-0 text-regular fs-5 mt-3 mx-auto user-select-none">' +
          '<span>المزيــد</span><img class="ms-3" src="./img/icons/arrow-link.svg" alt="" width="25"></button></div>';
      }).join("");
    } catch (err) {
      console.error("SAFIR trips load error", err);
    }
  }

  var fallbackContent = {
    umrahGuide: {
      title: "شرح العمرة",
      intro: "دليل مبسط يساعدك على الاستعداد للعمرة وفهم مراحل الرحلة من الإحرام وحتى إتمام المناسك، مع إمكانية إضافة الصور وفيديوهات الشرح من سفير الحرمين.",
      image: "https://safiralharamain.com/img/umrah-trips.png",
      gallery: [],
      videos: []
    },
    hajjGuide: {
      title: "شرح الحج",
      intro: "قسم مخصص لشرح رحلة الحج ومراحل البرنامج والاستعدادات المهمة، ويمكن تحديثه بالصور وفيديوهات الشرح من الإدارة.",
      image: "https://safiralharamain.com/img/hajj-large.png",
      gallery: [],
      videos: []
    },
    previousTrips: []
  };

  function injectStyles() {
    var style = document.createElement("style");
    style.textContent =
      ':root{--safir-gold:#c79a3b;--safir-gold-dark:#9b7326;--safir-ink:#231f20;--safir-ivory:#fffaf0;--safir-soft:#f7f3ea}' +
      'body{font-size:18px!important;line-height:1.85;background:#fff;color:var(--safir-ink)}' +
      '.navbar .nav-link{font-size:1.05rem!important}.umrah-head-page h1{font-size:clamp(2rem,4vw,3.4rem)!important;font-weight:700}' +
      '.umrah-head-page p{font-size:clamp(1.1rem,2vw,1.45rem)!important}' +
      '.safir-hub{background:linear-gradient(180deg,#fff 0%,var(--safir-ivory) 100%);padding:70px 0}' +
      '.safir-hub-nav{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:45px}' +
      '.safir-hub-nav a{padding:12px 22px;border:1px solid rgba(199,154,59,.45);border-radius:999px;color:var(--safir-ink);text-decoration:none;font-weight:700;background:#fff}' +
      '.safir-hub-nav a:hover{background:var(--safir-gold);color:#fff}' +
      '.safir-block{background:#fff;border:1px solid rgba(199,154,59,.2);border-radius:28px;padding:32px;margin-bottom:32px;box-shadow:0 14px 45px rgba(0,0,0,.06)}' +
      '.safir-block h2{font-size:clamp(1.7rem,3vw,2.4rem);color:var(--safir-gold-dark);font-weight:700;margin-bottom:16px}' +
      '.safir-block p{font-size:1.12rem;color:#4a4642}' +
      '.safir-guide-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);gap:28px;align-items:center}' +
      '.safir-guide-image{width:100%;max-height:390px;object-fit:cover;border-radius:22px;box-shadow:0 12px 30px rgba(0,0,0,.1)}' +
      '.safir-gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-top:22px}' +
      '.safir-gallery img{width:100%;height:180px;object-fit:cover;border-radius:18px;cursor:pointer}' +
      '.safir-videos{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px;margin-top:24px}' +
      '.safir-video{position:relative;padding-top:56.25%;overflow:hidden;border-radius:20px;background:#111;box-shadow:0 10px 28px rgba(0,0,0,.12)}' +
      '.safir-video iframe{position:absolute;inset:0;width:100%;height:100%;border:0}' +
      '.safir-trips-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:22px}' +
      '.safir-old-trip{border:1px solid rgba(199,154,59,.25);border-radius:22px;overflow:hidden;background:#fff}' +
      '.safir-old-trip .cover{width:100%;height:220px;object-fit:cover}.safir-old-trip .body{padding:20px}' +
      '.safir-old-trip h3{font-size:1.4rem;color:var(--safir-gold-dark);font-weight:700}.safir-old-trip .date{font-weight:700;color:#6f6351}' +
      '.safir-empty{text-align:center;padding:35px;border:1px dashed rgba(199,154,59,.5);border-radius:20px;color:#786c5a}' +
      '.safir-lightbox{position:fixed;inset:0;background:rgba(0,0,0,.88);display:none;align-items:center;justify-content:center;z-index:99999;padding:24px}' +
      '.safir-lightbox.open{display:flex}.safir-lightbox img{max-width:94vw;max-height:88vh;border-radius:16px}.safir-lightbox button{position:absolute;top:20px;left:20px;border:0;border-radius:50%;width:46px;height:46px;font-size:28px}' +
      '.booking-form label,.booking-form input,.booking-form textarea{font-size:1.05rem!important}' +
      '@media(max-width:768px){body{font-size:17px!important}.safir-guide-grid{grid-template-columns:1fr}.safir-block{padding:22px 16px;border-radius:22px}.safir-gallery img{height:150px}}';
    document.head.appendChild(style);
  }

  function youtubeId(url) {
    if (!url) return "";
    try {
      var u = new URL(url);
      if (u.hostname.indexOf("youtu.be") !== -1) return u.pathname.replace("/", "").split("?")[0];
      if (u.pathname.indexOf("/shorts/") === 0) return u.pathname.split("/shorts/")[1].split("/")[0];
      if (u.pathname.indexOf("/embed/") === 0) return u.pathname.split("/embed/")[1].split("/")[0];
      return u.searchParams.get("v") || "";
    } catch (e) { return ""; }
  }

  function videoGrid(videos) {
    if (!videos || !videos.length) return "";
    return '<div class="safir-videos">' + videos.map(function (url) {
      var id = youtubeId(url);
      if (!id) return "";
      return '<div class="safir-video"><iframe src="https://www.youtube-nocookie.com/embed/' + id + '" title="فيديو سفير الحرمين" loading="lazy" allowfullscreen></iframe></div>';
    }).join("") + '</div>';
  }

  function galleryHtml(images) {
    if (!images || !images.length) return "";
    return '<div class="safir-gallery">' + images.map(function (src) {
      return '<img src="' + src + '" alt="صور سفير الحرمين" loading="lazy" data-safir-lightbox>';
    }).join("") + '</div>';
  }

  function guideHtml(id, item) {
    return '<article class="safir-block" id="' + id + '">' +
      '<div class="safir-guide-grid"><div><h2>' + item.title + '</h2><p>' + item.intro + '</p></div>' +
      '<div><img class="safir-guide-image" src="' + item.image + '" alt="' + item.title + '" loading="lazy"></div></div>' +
      galleryHtml(item.gallery) + videoGrid(item.videos) + '</article>';
  }

  function previousTripsHtml(items) {
    if (!items || !items.length) {
      return '<div class="safir-empty">سيتم إضافة صور وفيديوهات رحلاتنا السابقة من لوحة الإدارة.</div>';
    }
    return '<div class="safir-trips-grid">' + items.map(function (trip) {
      var cover = trip.cover || (trip.gallery && trip.gallery[0]) || "https://safiralharamain.com/img/umrah-trips.png";
      return '<article class="safir-old-trip"><img class="cover" src="' + cover + '" alt="' + trip.title + '" loading="lazy" data-safir-lightbox>' +
        '<div class="body"><h3>' + trip.title + '</h3><div class="date">' + (trip.date || "") + '</div><p>' + (trip.description || "") + '</p>' +
        galleryHtml(trip.gallery) + videoGrid(trip.videos) + '</div></article>';
    }).join("") + '</div>';
  }

  async function loadContent() {
    try {
      var res = await fetch("./site-content.json?ts=" + Date.now(), { cache: "no-store" });
      if (!res.ok) throw new Error("content not found");
      return await res.json();
    } catch (e) {
      return fallbackContent;
    }
  }

  async function buildHub() {
    var tripsSection = tripsContainer ? tripsContainer.closest("section") : null;
    if (!tripsSection) return;
    var data = await loadContent();
    var hub = document.createElement("section");
    hub.className = "safir-hub";
    hub.innerHTML =
      '<div class="container"><nav class="safir-hub-nav" aria-label="أقسام العمرة">' +
      '<a href="#safir-umrah-guide">شرح العمرة</a><a href="#safir-hajj-guide">شرح الحج</a><a href="#safir-previous-trips">من رحلاتنا السابقة</a>' +
      '</nav>' +
      guideHtml("safir-umrah-guide", data.umrahGuide || fallbackContent.umrahGuide) +
      guideHtml("safir-hajj-guide", data.hajjGuide || fallbackContent.hajjGuide) +
      '<article class="safir-block" id="safir-previous-trips"><h2>من رحلاتنا السابقة</h2><p>صور وفيديوهات حقيقية من رحلات سفير الحرمين.</p>' +
      previousTripsHtml(data.previousTrips || []) + '</article></div>';
    tripsSection.insertAdjacentElement("afterend", hub);
  }

  function setupLightbox() {
    var box = document.createElement("div");
    box.className = "safir-lightbox";
    box.innerHTML = '<button type="button" aria-label="إغلاق">×</button><img alt="صورة مكبرة">';
    document.body.appendChild(box);
    document.addEventListener("click", function (e) {
      var img = e.target.closest("[data-safir-lightbox]");
      if (img) {
        box.querySelector("img").src = img.src;
        box.classList.add("open");
      }
      if (e.target === box || e.target.tagName === "BUTTON") box.classList.remove("open");
    });
  }

  injectStyles();
  renderCurrentTrips();
  buildHub();
  setupLightbox();
})();
