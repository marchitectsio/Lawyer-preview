(function () {
  "use strict";

  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const $ = (sel, root = document) => root.querySelector(sel);

  const DATA = window.WALSH_SITE_DATA || {};

  function setYear() {
    const y = new Date().getFullYear();
    $$(".js_year").forEach(el => el.textContent = String(y));
  }

  function lockBody(lock) {
    document.documentElement.dataset.modal_open = lock ? "true" : "false";
    document.body.style.overflow = lock ? "hidden" : "";
  }

  function initNav() {
    const toggle = $("#nav_toggle");
    const nav = $("#site_nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", () => {
      const open = nav.dataset.open === "true";
      nav.dataset.open = open ? "false" : "true";
      toggle.setAttribute("aria-expanded", open ? "false" : "true");
    });

    // close on escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.dataset.open === "true") {
        nav.dataset.open = "false";
        toggle.setAttribute("aria-expanded", "false");
        $$(".dropdown", nav).forEach(d => d.dataset.open = "false");
      }
    });

    // dropdown handling for mobile
    $$(".dropdown > button.link_btn", nav).forEach(btn => {
      btn.addEventListener("click", () => {
        const parent = btn.closest(".dropdown");
        const open = parent.dataset.open === "true";
        parent.dataset.open = open ? "false" : "true";
        btn.setAttribute("aria-expanded", open ? "false" : "true");
      });
    });

    // close nav on link click
    $$("#site_nav a").forEach(a => {
      a.addEventListener("click", () => {
        nav.dataset.open = "false";
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function initReveal() {
    const items = $$(".reveal");
    if (!items.length) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      items.forEach(el => el.dataset.visible = "true");
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(ent => {
        if (ent.isIntersecting) {
          ent.target.dataset.visible = "true";
          io.unobserve(ent.target);
        }
      });
    }, { threshold: 0.12 });

    items.forEach(el => io.observe(el));
  }

  function initCaseResults() {
    const grid = $("#case_results_grid");
    const modalBackdrop = $("#case_modal_backdrop");
    const modalTitle = $("#case_modal_title");
    const modalMeta = $("#case_modal_meta");
    const modalBody = $("#case_modal_body");
    const modalClose = $("#case_modal_close");

    if (!grid || !modalBackdrop || !modalTitle || !modalBody || !modalClose) return;
    const items = (DATA.case_results || []);

    function renderCard(item) {
      const card = document.createElement("article");
      card.className = "card reveal";
      card.innerHTML = `
        <div class="card_inner stack_16">
          <div class="stack_10">
            <h3 class="gold_title">${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.summary)}</p>
          </div>
          <div class="badges" aria-label="Case metadata">
            <span class="badge">${escapeHtml(item.location)}</span>
            <span class="badge">${escapeHtml(item.outcome)}</span>
          </div>
          <div>
            <button class="btn btn_ghost" type="button" data_case_open="${escapeAttr(item.id)}">Continue reading</button>
          </div>
        </div>
      `;
      return card;
    }

    grid.innerHTML = "";
    items.forEach(item => grid.appendChild(renderCard(item)));

    function openModal(item) {
      modalTitle.textContent = item.title;
      modalMeta.textContent = `${item.location} • ${item.charges} • Outcome: ${item.outcome}`;
      const paragraphs = (item.narrative || []).map(p => `<p>${escapeHtml(p)}</p>`).join("");
      const moves = (item.defense_moves || []).map(m => `<li>${escapeHtml(m)}</li>`).join("");
      modalBody.innerHTML = `
        <div class="stack_16">
          <div class="note">
            <strong>What mattered most:</strong> early action, evidence preservation, and a plan built around what the prosecution can actually prove.
          </div>
          <div class="stack_10">${paragraphs}</div>
          <div class="panel">
            <h3>Defense strategy highlights</h3>
            <ul>${moves}</ul>
            <p class="help">Case results vary based on facts, prior record, and local practices. This summary is informational and not a promise of outcome.</p>
          </div>
        </div>
      `;
      modalBackdrop.dataset.open = "true";
      modalBackdrop.setAttribute("aria-hidden", "false");
      lockBody(true);
      modalClose.focus();
      trapFocus(modalBackdrop.querySelector(".modal"));
    }

    function closeModal() {
      modalBackdrop.dataset.open = "false";
      modalBackdrop.setAttribute("aria-hidden", "true");
      lockBody(false);
      releaseFocusTrap();
    }

    grid.addEventListener("click", (e) => {
      const btn = e.target.closest("[data_case_open]");
      if (!btn) return;
      const id = btn.getAttribute("data_case_open");
      const item = items.find(x => x.id === id);
      if (item) openModal(item);
    });

    modalClose.addEventListener("click", closeModal);
    modalBackdrop.addEventListener("click", (e) => {
      if (e.target === modalBackdrop) closeModal();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modalBackdrop.dataset.open === "true") closeModal();
    });
  }

  function initReviewsSlider() {
    const track = $("#reviews_track");
    const prev = $("#reviews_prev");
    const next = $("#reviews_next");
    const pos = $("#reviews_position");

    if (!track || !prev || !next) return;

    const reviews = DATA.reviews || [];
    track.innerHTML = reviews.map(r => slideHtml(r)).join("");
    const slides = $$(".slide", track);
    let idx = 0;

    function update() {
      track.style.transform = `translateX(-${idx * 100}%)`;
      if (pos) pos.textContent = `${idx + 1} of ${slides.length}`;
      prev.disabled = idx === 0;
      next.disabled = idx === slides.length - 1;
    }

    prev.addEventListener("click", () => { idx = Math.max(0, idx - 1); update(); });
    next.addEventListener("click", () => { idx = Math.min(slides.length - 1, idx + 1); update(); });

    // swipe support
    let startX = null;
    track.addEventListener("pointerdown", (e) => { startX = e.clientX; track.setPointerCapture(e.pointerId); });
    track.addEventListener("pointerup", (e) => {
      if (startX === null) return;
      const delta = e.clientX - startX;
      startX = null;
      if (Math.abs(delta) < 50) return;
      if (delta < 0) idx = Math.min(slides.length - 1, idx + 1);
      else idx = Math.max(0, idx - 1);
      update();
    });

    update();
  }

  function initBlogIndex() {
    const list = $("#blog_list");
    const category = $("#blog_category");
    const search = $("#blog_search");
    const sort = $("#blog_sort");

    if (!list) return;

    const posts = (DATA.blog_posts || []).slice().sort((a, b) => (a.date < b.date ? 1 : -1));

    const categories = Array.from(new Set(posts.flatMap(p => p.category || []))).sort();
    if (category) {
      category.innerHTML = `<option value="">All categories</option>` + categories.map(c => `<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join("");
    }

    function render(items) {
      list.innerHTML = items.map(postCardHtml).join("");
    }

    function apply() {
      const q = (search ? search.value : "").trim().toLowerCase();
      const cat = (category ? category.value : "").trim();

      let items = posts.filter(p => {
        const catOk = !cat || (p.category || []).includes(cat);
        const qOk = !q || [p.title, p.excerpt, (p.tags || []).join(" ")].join(" ").toLowerCase().includes(q);
        return catOk && qOk;
      });

      if (sort && sort.value === "old") items = items.slice().sort((a, b) => (a.date > b.date ? 1 : -1));
      render(items);
    }

    [category, search, sort].filter(Boolean).forEach(el => el.addEventListener("input", apply));
    render(posts);
  }

  function initForm() {
    const form = $("#consultation_form");
    if (!form) return;

    const status = $("#form_status");
    const required = ["first_name","last_name","phone","email","client_status","message","consent"];

    function setStatus(msg, ok) {
      if (!status) return;
      status.textContent = msg;
      status.style.color = ok ? "var(--gold_400)" : "#ffd2d2";
    }

    function validEmail(v) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    }

    function validate() {
      let ok = true;
      required.forEach(name => {
        const el = form.elements[name];
        if (!el) return;
        const field = el.closest(".field") || el.closest(".inline") || el.parentElement;
        const err = field ? $(".field_error", field) : null;

        let msg = "";
        if (el.type === "checkbox") {
          if (!el.checked) msg = "Please confirm consent.";
        } else if (!String(el.value || "").trim()) {
          msg = "This field is required.";
        } else if (name === "email" && !validEmail(String(el.value))) {
          msg = "Please enter a valid email.";
        }

        if (err) err.textContent = msg;
        if (msg) ok = false;
      });

      return ok;
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const ok = validate();
      if (!ok) {
        setStatus("Please review the highlighted fields and try again.", false);
        return;
      }

      // This is a front end demo. Swap the block below with a real endpoint.
      const payload = Object.fromEntries(new FormData(form).entries());
      console.log("Consultation request payload:", payload);

      setStatus("Thanks. A member of our team will reach out shortly.", true);
      form.reset();
    });
  }

  /* Focus trap for modal accessibility */
  let trapCleanup = null;

  function trapFocus(modalEl) {
    if (!modalEl) return;
    const focusables = $$("a, button, input, select, textarea, [tabindex]:not([tabindex='-1'])", modalEl)
      .filter(el => !el.disabled && el.getAttribute("aria-hidden") !== "true");

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    function handler(e) {
      if (e.key !== "Tab") return;
      if (focusables.length === 0) return;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    modalEl.addEventListener("keydown", handler);
    trapCleanup = () => modalEl.removeEventListener("keydown", handler);
  }

  function releaseFocusTrap() {
    if (trapCleanup) trapCleanup();
    trapCleanup = null;
  }

  function escapeHtml(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replaceAll(" ", "_");
  }

  function slideHtml(r) {
    const stars = new Array(r.stars || 5).fill(0).map(() => `<img src="assets/img/icon_star.svg" alt="" />`).join("");
    return `
      <div class="slide" role="group" aria-label="Client testimonial">
        <div class="stars" aria-hidden="true">${stars}</div>
        <blockquote>“${escapeHtml(r.quote)}”</blockquote>
        <div class="reviewer">${escapeHtml(r.name)}</div>
      </div>
    `;
  }

  function postCardHtml(p) {
    const cats = (p.category || []).slice(0, 2).map(c => `<span class="badge">${escapeHtml(c)}</span>`).join("");
    const date = new Date(p.date + "T00:00:00");
    const nice = date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    return `
      <article class="card reveal">
        <div class="card_inner stack_16">
          <div class="stack_10">
            <h3 class="gold_title">${escapeHtml(p.title)}</h3>
            <div class="badges" aria-label="Post categories">${cats}</div>
            <p>${escapeHtml(p.excerpt)}</p>
            <small>${nice} • ${p.minutes || 6} min read</small>
          </div>
          <div>
            <a class="btn btn_ghost" href="${escapeHtml(p.url)}">Read article</a>
          </div>
        </div>
      </article>
    `;
  }

  function initActiveNav() {
    const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    $$(".nav a").forEach(a => {
      const href = (a.getAttribute("href") || "").toLowerCase();
      if (!href) return;
      if (href === path) a.dataset.active = "true";
    });
  }

  // boot
  document.addEventListener("DOMContentLoaded", () => {
    setYear();
    initNav();
    initActiveNav();
    initReveal();
    initCaseResults();
    initReviewsSlider();
    initBlogIndex();
    initForm();
  });
})();
