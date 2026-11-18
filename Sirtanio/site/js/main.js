/* Sirtanio 360: interaksi halaman (tanpa framework). Dipakai oleh index.html dan lot.html */
(() => {
  "use strict";

  const DEMO_LOT = "LOT-BWI-2026-1104";
  const LOT_FORMAT = /^LOT-[A-Z]{3}-\d{4}-\d{4}$/;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const page = document.body.dataset.page;

  /* ---------- Helper ---------- */
  const goLot = (code) => {
    location.href = "lot.html?kode=" + encodeURIComponent(code);
  };
  const scrollToId = (id) =>
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

  // Terapkan kelas "aktif" atau "tidak aktif" ke elemen yang punya data-on / data-off.
  function applyState(root, active) {
    const els = [root, ...$$("[data-on]", root)].filter(
      (el) => el.dataset.on !== undefined,
    );
    els.forEach((el) => {
      el.className = active ? el.dataset.on : el.dataset.off;
    });
  }

  /* ---------- Navbar ---------- */
  const header = $("header");
  const menu = $("#menu-mobile");
  const toggle = $("[data-menu-toggle]");
  const HEADER_SOLID = ["border-line", "bg-cream/95", "backdrop-blur"];
  const HEADER_FLAT = ["border-transparent", "bg-cream"];

  function updateHeader() {
    if (!header) return;
    const solid = window.scrollY > 8 || (menu && !menu.hidden);
    header.classList.remove(...(solid ? HEADER_FLAT : HEADER_SOLID));
    header.classList.add(...(solid ? HEADER_SOLID : HEADER_FLAT));
  }

  function setMenu(open) {
    if (!menu || !toggle) return;
    menu.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
    $("[data-icon=open]", toggle).classList.toggle("hidden", open);
    $("[data-icon=close]", toggle).classList.toggle("hidden", !open);
    updateHeader();
  }

  toggle?.addEventListener("click", () => setMenu(menu.hidden));
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  /* ---------- Klik umum (delegasi) ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target.closest(
      "[data-scroll],[data-modal],[data-lot],[data-home],[data-demo-code],[data-tab],[data-tier],[data-install]",
    );
    if (!t) return;
    if (t.dataset.scroll) {
      setMenu(false);
      setTimeout(() => scrollToId(t.dataset.scroll), 50); // tunggu menu mobile menutup
    } else if (t.dataset.modal) {
      setMenu(false);
      openModal(t.dataset.modal);
    } else if (t.dataset.lot) goLot(t.dataset.lot);
    else if (t.dataset.home !== undefined)
      location.href =
        "index.html" + (t.dataset.home ? "#" + t.dataset.home : "");
    else if (t.dataset.demoCode !== undefined) $("#lot").value = DEMO_LOT;
    else if (t.dataset.tab) selectVariety(Number(t.dataset.tab));
    else if (t.dataset.tier) selectTier(t.dataset.tier);
    else if (t.dataset.install !== undefined) installApp();
  });

  /* ---------- Produk: pilih varietas & ukuran paket ---------- */
  function selectVariety(i) {
    $$("[data-tab]").forEach((btn) => {
      const on = Number(btn.dataset.tab) === i;
      btn.setAttribute("aria-selected", String(on));
      applyState(btn, on);
    });
    $$("[data-panel]").forEach((p) => {
      p.hidden = Number(p.dataset.panel) !== i;
    });
  }

  function selectTier(key) {
    $$("[data-tier]").forEach((btn) => {
      const on = btn.dataset.tier === key;
      btn.setAttribute("aria-checked", String(on));
      applyState(btn, on);
    });
    $$("[data-detail]").forEach((d) => {
      d.hidden = d.dataset.detail !== key;
    });
  }

  /* ---------- Cek kode lot ---------- */
  const lotForm = $("#lot-form");
  if (lotForm) {
    const input = $("#lot");
    const err = $("#lot-err");
    const BAD = ["border-terracotta", "focus:ring-terracotta/25"];
    const OK = ["border-line", "focus:border-forest", "focus:ring-forest/20"];

    lotForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const code = input.value.trim().toUpperCase();
      const valid = LOT_FORMAT.test(code);
      err.hidden = valid;
      input.setAttribute("aria-invalid", String(!valid));
      input.classList.remove(...(valid ? BAD : OK));
      input.classList.add(...(valid ? OK : BAD));
      if (valid) return goLot(code);
      $("[data-err-text]", err).textContent =
        "Format kode belum sesuai. Contoh: LOT-BWI-2026-1104";
      input.setAttribute("aria-describedby", "lot-err");
    });
  }

  /* ---------- Modal ---------- */
  let modalEl = null;
  let modalName = null;
  let lastFocus = null;
  const FOCUSABLE = "a[href],button:not([disabled]),input,select,textarea";

  function openModal(name) {
    const tpl = $("#tpl-" + name);
    if (!tpl) return;
    closeModal();
    lastFocus = document.activeElement;
    modalName = name;
    modalEl = tpl.content.firstElementChild.cloneNode(true);
    document.body.append(modalEl);
    document.body.style.overflow = "hidden";
    if (name === "login") {
      let saved = null;
      try {
        saved = localStorage.getItem("sirtanio.role");
      } catch {
        /* abaikan */
      }
      const select = $("select", modalEl);
      if (saved && $(`option[value="${saved}"]`, select)) select.value = saved;
    }
    $("input,select,button[data-autofocus],button", modalEl)?.focus();
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.remove();
    modalEl = modalName = null;
    document.body.style.overflow = "";
    lastFocus?.focus?.();
  }

  document.addEventListener("click", (e) => {
    if (modalEl && e.target.closest("[data-close]")) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (!modalEl) return;
    if (e.key === "Escape") return closeModal();
    if (e.key !== "Tab") return;
    const f = $$(FOCUSABLE, modalEl);
    if (!f.length) return;
    const [first, last] = [f[0], f[f.length - 1]];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  document.addEventListener("submit", (e) => {
    const form = e.target;
    if (form.matches("[data-lead-form]")) {
      e.preventDefault();
      const done = $(
        "#tpl-" + modalName + "-done",
      )?.content.firstElementChild.cloneNode(true);
      if (!done) return;
      form.replaceWith(done);
      $("button", done)?.focus();
    } else if (form.matches("[data-login-form]")) {
      e.preventDefault();
      // Prototipe: tidak ada verifikasi akun. Peran disimpan lalu langsung membuka portal.
      const select = $("select", form);
      const home = select.selectedOptions[0].dataset.home;
      try {
        localStorage.setItem("sirtanio.role", select.value);
      } catch {
        /* penyimpanan dinonaktifkan */
      }
      location.href = "portal.html#/portal" + (home ? "/" + home : "");
    }
  });

  /* ---------- Halaman lot ---------- */
  if (page === "lot") {
    const code = (new URLSearchParams(location.search).get("kode") || "")
      .trim()
      .toUpperCase();
    const verified = $("[data-verified]");
    const unknown = $("[data-unknown]");
    const isValid = code === DEMO_LOT;
    verified.hidden = !isValid;
    unknown.hidden = isValid;
    document.title =
      (isValid ? "Lot " + code : "Kode lot tidak dikenali") + " | Sirtanio 360";
    if (!isValid) $("[data-unknown-id]").textContent = code || "(kosong)";

    // Akordeon tahapan perjalanan beras
    $$("[data-step]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const i = btn.dataset.step;
        const detail = $(`[data-step-detail="${i}"]`);
        const willOpen = detail.hidden;
        $$("[data-step-detail]").forEach((d) => {
          d.hidden = true;
        });
        $$("[data-step]").forEach((b) => {
          b.setAttribute("aria-expanded", "false");
          $("svg", b)?.classList.remove("rotate-180");
        });
        if (willOpen) {
          detail.hidden = false;
          btn.setAttribute("aria-expanded", "true");
          $("svg", btn)?.classList.add("rotate-180");
        }
      }),
    );

    // Kalkulator porsi: 1 porsi = 75 g beras, air 1 : 1,5 (dibulatkan 10 ml)
    const portionsEl = $("[data-portions]");
    const setPortions = (n) => {
      const portions = Math.min(10, Math.max(1, n));
      const rice = portions * 75;
      portionsEl.textContent = portions;
      $("[data-rice]").textContent = rice;
      $("[data-water]").textContent = Math.round((rice * 1.5) / 10) * 10;
      $$("[data-portion]").forEach((b) => {
        b.disabled =
          (b.dataset.portion < 0 && portions <= 1) ||
          (b.dataset.portion > 0 && portions >= 10);
      });
    };
    $$("[data-portion]").forEach((b) =>
      b.addEventListener("click", () =>
        setPortions(Number(portionsEl.textContent) + Number(b.dataset.portion)),
      ),
    );

    // Salin kode lot
    const copyBtn = $("[data-copy]");
    copyBtn?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(DEMO_LOT);
      } catch {
        /* abaikan jika izin ditolak */
      }
      $("[data-icon=copy]", copyBtn).classList.add("hidden");
      $("[data-icon=check]", copyBtn).classList.remove("hidden");
      $("[data-copy-msg]").textContent = "Kode lot disalin";
      setTimeout(() => {
        $("[data-icon=copy]", copyBtn).classList.remove("hidden");
        $("[data-icon=check]", copyBtn).classList.add("hidden");
        $("[data-copy-msg]").textContent = "";
      }, 1800);
    });
  }

  /* ---------- PWA: offline, install, service worker ---------- */
  const banner = $("#offline-banner");
  const syncOnline = () => {
    if (banner) banner.hidden = navigator.onLine;
  };
  window.addEventListener("online", syncOnline);
  window.addEventListener("offline", syncOnline);
  syncOnline();

  let installEvent = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    installEvent = e;
    $$(".install-btn").forEach((b) => b.setAttribute("data-ready", ""));
  });
  window.addEventListener("appinstalled", () => {
    installEvent = null;
    $$(".install-btn").forEach((b) => b.removeAttribute("data-ready"));
  });
  async function installApp() {
    if (!installEvent) return;
    installEvent.prompt();
    await installEvent.userChoice;
    installEvent = null;
    $$(".install-btn").forEach((b) => b.removeAttribute("data-ready"));
  }

  // Service worker hanya didaftarkan lewat HTTPS agar tidak mengganggu saat pengembangan lokal.
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", () =>
      navigator.serviceWorker.register("sw.js").catch(() => {}),
    );
  }
})();
