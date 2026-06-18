// ============================================================
// IT CHARGING — site interactions
// Handles: site menu toggle, search overlay expand/collapse,
// newsletter form (prevented from real-submitting — see note below)
//
// NOT wired up yet (need real article data first — coming once
// articles are converted into the new template):
//   - search results
//   - "related articles" block on article pages
//   - "fresh on reload" homepage rotation
//   - newsletter signup (needs a real provider — Mailchimp,
//     ConvertKit, Buttondown, etc. — a static site can't accept
//     form POSTs on its own, which is why a plain <form method="post">
//     here would throw a 405 error)
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
  // ---- Site menu (hamburger) ----
  var navToggle = document.querySelector(".nav-toggle");
  var siteMenu = document.querySelector(".site-menu");

  if (navToggle && siteMenu) {
    navToggle.addEventListener("click", function () {
      var isOpen = siteMenu.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  // ---- Search overlay ----
  var searchToggle = document.querySelector(".search-toggle");
  var searchPanel = document.querySelector(".search-panel");
  var searchClose = document.querySelector(".search-close");

  function openSearch() {
    searchPanel.classList.add("is-open");
    searchToggle.setAttribute("aria-expanded", "true");
    var input = searchPanel.querySelector("input");
    if (input) input.focus();
  }
  function closeSearch() {
    searchPanel.classList.remove("is-open");
    searchToggle.setAttribute("aria-expanded", "false");
  }

  if (searchToggle && searchPanel) {
    searchToggle.addEventListener("click", function () {
      var isOpen = searchPanel.classList.contains("is-open");
      if (isOpen) { closeSearch(); } else { openSearch(); }
    });
  }
  if (searchClose) {
    searchClose.addEventListener("click", closeSearch);
  }

  // Placeholder submit handler so the form doesn't try to navigate
  // anywhere before real search is wired up.
  var searchForm = document.querySelector(".search-panel form");
  if (searchForm) {
    searchForm.addEventListener("submit", function (e) {
      e.preventDefault();
      // TODO: replace with real search once the article index exists.
      console.log("Search isn't wired up yet — coming once articles are converted.");
    });
  }

  // ---- Newsletter form ----
  // A static site hosted on GitHub Pages has nowhere to send a real
  // POST request, so submitting this form normally throws a 405
  // (Method Not Allowed). We stop the native submit here and show a
  // message instead. Once a real provider (Mailchimp, ConvertKit,
  // Buttondown, etc.) is hooked up, replace this handler with either
  // a fetch() call to that provider's API or point the form's
  // action/method straight at the embed code they give you.
  var newsletterForm = document.getElementById("newsletterForm");
  var newsletterMsg = document.getElementById("newsletterMsg");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (newsletterMsg) {
        newsletterMsg.textContent = "Signups aren't connected to a mailing list yet — this will work once a real provider is hooked up.";
      }
    });
  }
});
