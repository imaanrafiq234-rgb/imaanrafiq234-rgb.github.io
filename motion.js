/* Imaan Rafiq
   Interaction layer: reading progress, image-preview cursor, card tilt,
   pinned process sequence, plate lightbox, keyboard navigation.
   Everything here is optional: without JS or with reduced motion the
   pages read as plain documents. */
(() => {
  "use strict";

  const html = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* rAF-throttled scroll update. The timer fallback matters: in a background
     tab (and in some embedded webviews) requestAnimationFrame never fires,
     which would otherwise leave the queued flag stuck and the state frozen. */
  const scrollThrottle = (fn) => {
    let queued = false;
    const run = () => {
      if (!queued) return;
      queued = false;
      fn();
    };
    const kick = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(run);
      setTimeout(run, 120);
    };
    addEventListener("scroll", kick, { passive: true });
    addEventListener("resize", kick, { passive: true });
    return kick;
  };

  /* ---------------------------------------------------------------------
     Reading progress
     --------------------------------------------------------------------- */
  const bar = document.createElement("div");
  bar.className = "scroll-progress";
  bar.innerHTML = "<i></i>";
  document.body.appendChild(bar);
  const fill = bar.firstElementChild;

  const setProgress = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    fill.style.transform = `scaleX(${p.toFixed(4)})`;
  };
  scrollThrottle(setProgress);
  setProgress();

  /* ---------------------------------------------------------------------
     Cursor: dot follows exactly, ring trails, project image for archive rows
     --------------------------------------------------------------------- */
  if (fine && !reduce) {
    html.classList.add("has-cursor");

    const cur = document.createElement("div");
    cur.className = "cursor";
    cur.setAttribute("aria-hidden", "true");
    cur.innerHTML =
      '<span class="cursor__ring"></span><span class="cursor__dot"></span>' +
      '<span class="cursor__label"></span><img class="cursor__img" alt="" />';
    document.body.appendChild(cur);

    const ring = cur.querySelector(".cursor__ring");
    const dot = cur.querySelector(".cursor__dot");
    const label = cur.querySelector(".cursor__label");
    const preview = cur.querySelector(".cursor__img");

    let mx = innerWidth / 2,
      my = innerHeight / 2,
      rx = mx,
      ry = my,
      alive = true;

    addEventListener(
      "pointermove",
      (e) => {
        mx = e.clientX;
        my = e.clientY;
        dot.style.transform = `translate(${mx}px, ${my}px)`;
      },
      { passive: true }
    );

    addEventListener("pointerleave", () => {
      alive = false;
      cur.style.opacity = "0";
    });
    addEventListener("pointerenter", () => {
      alive = true;
      cur.style.opacity = "1";
    });

    const trail = () => {
      if (alive) {
        rx += (mx - rx) * 0.18;
        ry += (my - ry) * 0.18;
        const t = `translate(${rx}px, ${ry}px)`;
        ring.style.transform = t;
        label.style.transform = t;
        preview.style.transform = t;
      }
      requestAnimationFrame(trail);
    };
    requestAnimationFrame(trail);

    const clearCursor = () => cur.classList.remove("is-hover", "is-lens");

    document.addEventListener("pointerover", (e) => {
      const hit = e.target.closest(".arch, a, button, [data-cursor]");
      if (!hit) return clearCursor();

      const cover = hit.classList.contains("arch") ? hit.querySelector("img") : null;
      if (cover) {
        preview.src = cover.getAttribute("src") || "";
        cur.classList.add("is-lens");
        cur.classList.remove("is-hover");
        return;
      }

      cur.classList.remove("is-lens");
      const text =
        hit.dataset.cursor ||
        (hit.matches(".card") || hit.matches(".arch") ? "Open" : "") ||
        (hit.matches(".pdialog__close") ? "Close" : "");
      label.textContent = text;
      cur.classList.toggle("is-hover", Boolean(text));
    });

    document.addEventListener("pointerout", (e) => {
      if (!e.relatedTarget) clearCursor();
    });

    document.addEventListener("pointerdown", () => cur.classList.add("is-down"));
    document.addEventListener("pointerup", () => cur.classList.remove("is-down"));

    /* card tilt: a few degrees of real depth, reset on leave */
    document.querySelectorAll(".card, .arch").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.classList.add("is-tilting");
        el.style.transform = `perspective(1000px) rotateX(${(-py * 3).toFixed(2)}deg) rotateY(${(px * 3.4).toFixed(2)}deg)`;
      });
      el.addEventListener("pointerleave", () => {
        el.classList.remove("is-tilting");
        el.style.transform = "";
      });
    });
  }

  /* ---------------------------------------------------------------------
     Pinned process sequence (home page only)
     --------------------------------------------------------------------- */
  const process = document.querySelector(".process");
  if (process) {
    const shots = [...process.querySelectorAll(".process__shot")];
    const steps = [...process.querySelectorAll(".process__steps li")];
    const rail = process.querySelector(".process__rail i");
    const wide = matchMedia("(min-width: 901px)");

    if (!reduce && wide.matches && shots.length) {
      html.classList.add("has-motion");

      const updateProcess = () => {
        const r = process.getBoundingClientRect();
        const total = r.height - innerHeight;
        const t = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
        const i = Math.min(shots.length - 1, Math.floor(t * shots.length));
        shots.forEach((s, k) => s.classList.toggle("is-active", k === i));
        steps.forEach((s, k) => s.classList.toggle("is-active", k === i));
        if (rail) rail.style.transform = `scaleY(${Math.max(0.02, t).toFixed(3)})`;
      };

      scrollThrottle(updateProcess);
      updateProcess();
    }
  }

  /* ---------------------------------------------------------------------
     Plate lightbox: every case-study and gallery plate opens full size
     --------------------------------------------------------------------- */
  const plates = [...document.querySelectorAll(".cs-gallery img, .post-grid figure img, .cs-plate img, .process__shot img")].filter(
    (img) => !img.closest("a")
  );

  if (plates.length) {
    const lb = document.createElement("div");
    lb.className = "lb";
    lb.innerHTML =
      '<img alt="" />' +
      '<button class="lb__btn lb__close" type="button" aria-label="Close">✕</button>' +
      '<button class="lb__btn lb__prev" type="button" aria-label="Previous image">←</button>' +
      '<button class="lb__btn lb__next" type="button" aria-label="Next image">→</button>' +
      '<span class="lb__count" aria-hidden="true"></span>';
    document.body.appendChild(lb);

    const big = lb.querySelector("img");
    const count = lb.querySelector(".lb__count");
    let at = 0;

    const show = (i) => {
      at = (i + plates.length) % plates.length;
      const src = plates[at].currentSrc || plates[at].src;
      big.src = src;
      big.alt = plates[at].alt || "";
      count.textContent = `${at + 1} / ${plates.length}`;
    };

    const openLb = (i) => {
      show(i);
      lb.classList.add("is-open");
      document.body.classList.add("is-locked");
    };
    const closeLb = () => {
      lb.classList.remove("is-open");
      document.body.classList.remove("is-locked");
    };

    plates.forEach((img, i) => {
      img.classList.add("is-plate");
      img.addEventListener("click", () => openLb(i));
    });

    lb.querySelector(".lb__close").addEventListener("click", closeLb);
    lb.querySelector(".lb__prev").addEventListener("click", () => show(at - 1));
    lb.querySelector(".lb__next").addEventListener("click", () => show(at + 1));
    lb.addEventListener("click", (e) => {
      if (e.target === lb) closeLb();
    });

    /* swipe on touch */
    let sx = 0;
    lb.addEventListener("touchstart", (e) => (sx = e.touches[0].clientX), { passive: true });
    lb.addEventListener(
      "touchend",
      (e) => {
        const dx = e.changedTouches[0].clientX - sx;
        if (Math.abs(dx) > 48) show(at + (dx < 0 ? 1 : -1));
      },
      { passive: true }
    );

    addEventListener("keydown", (e) => {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLb();
      if (e.key === "ArrowRight") show(at + 1);
      if (e.key === "ArrowLeft") show(at - 1);
    });
  }

  /* ---------------------------------------------------------------------
     Keyboard navigation between case studies
     --------------------------------------------------------------------- */
  const nextLink = document.querySelector('[data-nav="next"]');
  const prevLink = document.querySelector('[data-nav="prev"]');
  if (nextLink || prevLink) {
    addEventListener("keydown", (e) => {
      if (document.body.classList.contains("is-locked")) return;
      const t = e.target;
      if (t && t.nodeType === 1 && t.matches("input, textarea, select, [contenteditable]")) return;
      if (e.key === "ArrowRight" && nextLink) nextLink.click();
      if (e.key === "ArrowLeft" && prevLink) prevLink.click();
    });
  }
})();
