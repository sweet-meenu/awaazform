// AwaazForm motion layer — mirrors specifyapp.com's Framer interactions.
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Reveal: fade + 20px rise, 0.4s, staggered within each [data-stagger] group.
function initReveal() {
  document.querySelectorAll("[data-stagger]").forEach((group) => {
    group.querySelectorAll(":scope > [data-reveal]").forEach((el, i) => el.style.setProperty("--i", i));
  });

  const els = document.querySelectorAll("[data-reveal]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
  );
  els.forEach((el) => io.observe(el));
}

// Nav gains a hairline border once the page scrolls.
function initNav() {
  const nav = document.querySelector(".nav");
  if (!nav) return;
  const update = () => nav.classList.toggle("is-scrolled", window.scrollY > 8);
  update();
  window.addEventListener("scroll", update, { passive: true });
}

// Product shot starts tilted back and flattens as it scrolls into view.
function initShowcase() {
  const app = document.querySelector("[data-tilt]");
  if (!app || reduceMotion) return;
  let ticking = false;
  const update = () => {
    const rect = app.getBoundingClientRect();
    const vh = window.innerHeight;
    const progress = Math.min(Math.max((vh - rect.top) / (vh * 0.9), 0), 1);
    app.style.setProperty("--tilt", `${(1 - progress) * 18}deg`);
    app.style.setProperty("--scale", (0.92 + progress * 0.08).toFixed(3));
    ticking = false;
  };
  update();
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) requestAnimationFrame(update);
      ticking = true;
    },
    { passive: true }
  );
}

// Workflow: steps auto-advance with a progress rail; click to jump.
function initSteps() {
  const root = document.querySelector("[data-steps]");
  if (!root) return;
  const steps = [...root.querySelectorAll(".step")];
  const views = [...root.querySelectorAll(".panel__view")];
  const ms = 4500;
  root.style.setProperty("--step-ms", `${ms}ms`);
  let current = 0;
  let timer;

  const go = (i) => {
    current = (i + steps.length) % steps.length;
    steps.forEach((s, j) => {
      s.classList.toggle("is-active", j === current);
      // Restart the progress animation on re-activation.
      const bar = s.querySelector(".step__progress i");
      if (bar) { bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = ""; }
    });
    views.forEach((v, j) => v.classList.toggle("is-active", j === current));
    clearTimeout(timer);
    if (!reduceMotion) timer = setTimeout(() => go(current + 1), ms);
  };

  steps.forEach((s, i) => s.addEventListener("click", () => go(i)));
  go(0);
}

// Testimonial carousel: centred active card, side cards dimmed, dots + autoplay.
function initCarousel() {
  const root = document.querySelector("[data-carousel]");
  if (!root) return;
  const track = root.querySelector(".carousel__track");
  const slides = [...track.children];
  const dots = root.parentElement.querySelector(".dots");
  let current = 0;
  let timer;

  slides.forEach((_, i) => {
    const b = document.createElement("button");
    b.setAttribute("aria-label", `Show testimonial ${i + 1}`);
    b.addEventListener("click", () => go(i));
    dots.appendChild(b);
  });

  const go = (i) => {
    current = (i + slides.length) % slides.length;
    const slide = slides[current];
    const offset = slide.offsetLeft - (root.clientWidth - slide.offsetWidth) / 2;
    track.style.transform = `translateX(${-offset}px)`;
    slides.forEach((s, j) => s.classList.toggle("is-active", j === current));
    [...dots.children].forEach((d, j) => d.classList.toggle("is-active", j === current));
    clearTimeout(timer);
    if (!reduceMotion) timer = setTimeout(() => go(current + 1), 6000);
  };

  window.addEventListener("resize", () => go(current));
  go(1);
}

// Code tabs: swap snippet with a short fade-up.
function initTabs() {
  const root = document.querySelector("[data-tabs]");
  if (!root) return;
  const pre = root.querySelector("pre");
  const buttons = [...root.querySelectorAll(".tabs button")];
  const templates = Object.fromEntries(
    [...root.querySelectorAll("template")].map((t) => [t.dataset.tab, t.innerHTML.trim()])
  );

  buttons.forEach((btn) =>
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.toggle("is-active", b === btn));
      pre.innerHTML = templates[btn.dataset.tab];
      pre.classList.remove("is-swapping");
      void pre.offsetWidth;
      pre.classList.add("is-swapping");
    })
  );
  buttons[0]?.click();
}

// Marquees: duplicate content once so the -50% loop is seamless.
function initMarquees() {
  document.querySelectorAll(".marquee__track").forEach((track) => {
    [...track.children].forEach((child) => {
      const clone = child.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);
    });
  });
}

// Waveforms: generate bars so markup stays tidy.
function initWaves() {
  document.querySelectorAll(".wave[data-bars]").forEach((wave) => {
    const n = Number(wave.dataset.bars) || 12;
    wave.innerHTML = Array.from({ length: n }, () => "<i></i>").join("");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initWaves();
  initMarquees();
  initReveal();
  initNav();
  initShowcase();
  initSteps();
  initCarousel();
  initTabs();
});
