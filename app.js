/* Imaan Rafiq — shared behaviour: sticky header, scroll reveal, ticker, year */
(() => {
  "use strict";

  /* sticky header rule */
  const head = document.querySelector(".site-head");
  if (head) {
    const onScroll = () => head.classList.toggle("is-stuck", window.scrollY > 12);
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
  }

  /* reveal on first entry */
  const revealables = document.querySelectorAll("[data-reveal]");
  if (revealables.length) {
    if (!("IntersectionObserver" in window)) {
      revealables.forEach((el) => el.classList.add("is-in"));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.06 }
      );
      revealables.forEach((el) => io.observe(el));
    }
  }

  /* duplicate the ticker track so the loop is seamless */
  document.querySelectorAll(".ticker__track").forEach((track) => {
    track.innerHTML += track.innerHTML;
  });

  /* copy the email address, for anyone browsing without a mail app */
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
      } catch {
        return;
      }
      const label = btn.textContent;
      btn.textContent = "Copied";
      btn.classList.add("is-copied");
      setTimeout(() => {
        btn.textContent = label;
        btn.classList.remove("is-copied");
      }, 1800);
    });
  });

  /* footer year */
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
})();
