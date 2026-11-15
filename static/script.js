/* Fedan - shared script. No framework, no build step. */

/* ---------------------------------------------------------------
   WHATSAPP NUMBER - the one slot.
   Put the Fedan Ltd WhatsApp Business number between the quotes:
   country code first, digits only, no + and no spaces.
   While it is empty, every WhatsApp link on the site stays hidden
   and "Start with a conversation" goes to the contact page.
   --------------------------------------------------------------- */
var WHATSAPP_NUMBER = "447424282973"; /* Fedan line (Lyca eSIM). WhatsApp Business must be set up on this number. */

/* ------------------------------------------------------------------
   PHONE NUMBER - the one slot for the phone line.
   PHONE_NUMBER: digits only with country code, e.g. 447XXXXXXXXX.
   PHONE_DISPLAY: how it is written on the page, e.g. +44 7XXX XXXXXX.
   While PHONE_NUMBER is empty, every phone link stays hidden.
   ------------------------------------------------------------------ */
var PHONE_NUMBER = "447424282973";  /* Fedan line (Lyca eSIM, 15 Nov 2026) */
var PHONE_DISPLAY = "07424 282 973";

(function () {
  var doc = document;
  var lang = (doc.documentElement.lang || "en").slice(0, 2);
  var T = {
    en: { menu: "Menu", close: "Close", sending: "Sending", wa: "Hello, I found you on fedangroup.com and would like to talk about a project.", required: "Please fill this in.", email: "Please check the email address.", oneOf: "Please add an email or a phone number." },
    he: { menu: "תפריט", close: "סגירה", sending: "שולחים", wa: "שלום, הגעתי אליכם דרך fedangroup.com ואשמח לדבר על פרויקט.", required: "נא למלא את השדה.", email: "נא לבדוק את כתובת המייל.", oneOf: "נא להוסיף מייל או טלפון." },
    ru: { menu: "Меню", close: "Закрыть", sending: "Отправляем", wa: "Здравствуйте, пишу с сайта fedangroup.com, хотелось бы обсудить проект.", required: "Заполните это поле.", email: "Проверьте адрес электронной почты.", oneOf: "Укажите почту или телефон." }
  }[lang] || null;
  if (!T) T = { menu: "Menu", close: "Close", sending: "Sending", required: "Please fill this in.", email: "Please check the email address.", oneOf: "Please add an email or a phone number." };

  /* Mobile menu */
  var toggle = doc.querySelector("[data-menu]");
  var nav = doc.getElementById("nav");
  function setMenu(open) {
    doc.body.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.textContent = open ? T.close : T.menu;
  }
  if (toggle && nav) {
    toggle.addEventListener("click", function () { setMenu(!doc.body.classList.contains("nav-open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && doc.body.classList.contains("nav-open")) { setMenu(false); toggle.focus(); } });
    var wide = window.matchMedia("(min-width: 1241px)");
    var onWide = function (e) { if (e.matches) setMenu(false); };
    if (wide.addEventListener) wide.addEventListener("change", onWide); else wide.addListener(onWide);
  }

  /* WhatsApp */
  var wa = String(WHATSAPP_NUMBER).replace(/\D/g, "");
  if (wa) {
    doc.querySelectorAll("[data-wa-only]").forEach(function (el) { el.hidden = false; });
    doc.querySelectorAll("[data-wa-link]").forEach(function (a) {
      a.href = "https://wa.me/" + wa + (T.wa ? "?text=" + encodeURIComponent(T.wa) : "");
      a.target = "_blank";
      a.rel = "noopener";
    });
  }

  /* Phone */
  var tel = String(PHONE_NUMBER).replace(/\D/g, "");
  if (tel) {
    doc.querySelectorAll("[data-tel-only]").forEach(function (el) { el.hidden = false; });
    doc.querySelectorAll("[data-tel-link]").forEach(function (a) {
      a.href = "tel:+" + tel;
      if (!a.textContent.trim()) a.textContent = PHONE_DISPLAY || ("+" + tel);
    });
  }

  /* Where the visitor came from: ?src= or ?utm_source=, and the referring page */
  try {
    var q = new URLSearchParams(window.location.search);
    var srcParam = q.get("src") || q.get("utm_source");
    if (srcParam) sessionStorage.setItem("fedan_src", srcParam);
    var srcVal = sessionStorage.getItem("fedan_src") || "";
    doc.querySelectorAll('input[name="src"]').forEach(function (el) { el.value = srcVal; });
  } catch (e) {}
  doc.querySelectorAll('input[name="ref"]').forEach(function (el) { el.value = doc.referrer || ""; });

  /* Preselect "I am" from ?who=investor etc. */
  var who = new URLSearchParams(window.location.search).get("who");
  if (who) {
    doc.querySelectorAll('select[name="who"]').forEach(function (s) {
      for (var i = 0; i < s.options.length; i++) if (s.options[i].value === who) s.selectedIndex = i;
    });
  }

  /* Forms - Netlify Forms. Posts URL-encoded to "/"; Netlify replies with HTML, so success = HTTP 200. Notifications are set in Netlify. */
  function fieldOf(input) { return input.closest(".field") || input.parentNode; }
  function setError(input, msg) {
    var f = fieldOf(input);
    var err = f.querySelector(".field-error");
    if (!err) {
      err = doc.createElement("p");
      err.className = "field-error";
      err.id = input.id + "-error";
      f.appendChild(err);
    }
    err.textContent = msg;
    f.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", err.id);
  }
  function clearError(input) {
    var f = fieldOf(input);
    f.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");
    var err = f.querySelector(".field-error");
    if (err) err.remove();
  }
  function validate(form) {
    var bad = [];
    form.querySelectorAll("input, textarea, select").forEach(function (el) {
      if (el.type === "hidden" || el.closest(".hp")) return;
      clearError(el);
      var v = el.value.trim();
      if (el.required && !v) { setError(el, T.required); bad.push(el); }
      else if (el.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { setError(el, T.email); bad.push(el); }
    });
    var group = form.getAttribute("data-one-of");
    if (group) {
      var els = group.split(",").map(function (n) { return form.elements[n]; });
      if (els.every(function (el) { return !el.value.trim(); })) { setError(els[0], T.oneOf); bad.push(els[0]); }
    }
    if (bad.length) bad[0].focus();
    return !bad.length;
  }

  doc.querySelectorAll("form[data-form]").forEach(function (form) {
    form.noValidate = true;
    form.addEventListener("input", function (e) { if (e.target.getAttribute("aria-invalid")) clearError(e.target); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate(form)) return;
      var btn = form.querySelector('[type="submit"]');
      var label = btn.textContent;
      var status = form.querySelector(".form-status");
      if (status) status.hidden = true;
      btn.disabled = true;
      btn.setAttribute("aria-busy", "true");
      btn.textContent = T.sending;
      fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(new FormData(form)).toString() })
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); })
        .then(function () {
          form.classList.add("is-sent");
          var t = form.querySelector(".thanks");
          if (t) t.focus();
        })
        .catch(function () { if (status) status.hidden = false; })
        .then(function () {
          btn.disabled = false;
          btn.removeAttribute("aria-busy");
          btn.textContent = label;
        });
    });
  });
})();
