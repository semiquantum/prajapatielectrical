/* ============================================
   PRAJAPATI ELECTRICAL — GSAP Scroll Animations
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  function initAnimations() {
    // Register GSAP ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    // Refresh ScrollTrigger to ensure accurate layout calculations
    ScrollTrigger.refresh();

    // --- Hero Entrance Animations ---
    const heroTl = gsap.timeline({ delay: 0.1 });

  heroTl
    .from('.hero-badge', {
      opacity: 0,
      y: 30,
      duration: 0.6,
      ease: 'power3.out'
    })
    .from('.hero h1', {
      opacity: 0,
      y: 50,
      duration: 0.8,
      ease: 'power3.out'
    }, '-=0.3')
    .from('.hero-subtitle', {
      opacity: 0,
      y: 30,
      duration: 0.6,
      ease: 'power3.out'
    }, '-=0.4')
    .from('.hero-buttons .btn', {
      opacity: 0,
      y: 20,
      duration: 0.5,
      stagger: 0.15,
      ease: 'power3.out'
    }, '-=0.3')
    .from('.hero-stat', {
      opacity: 0,
      y: 30,
      duration: 0.5,
      stagger: 0.1,
      ease: 'power3.out'
    }, '-=0.2');

  // --- Generic Fade-Up Animations ---
  gsap.utils.toArray('.anim-fade-up').forEach(el => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none'
      }
    });
  });

  // --- Fade Left ---
  gsap.utils.toArray('.anim-fade-left').forEach(el => {
    gsap.to(el, {
      opacity: 1,
      x: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none'
      }
    });
  });

  // --- Fade Right ---
  gsap.utils.toArray('.anim-fade-right').forEach(el => {
    gsap.to(el, {
      opacity: 1,
      x: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none'
      }
    });
  });

  // --- Scale In ---
  gsap.utils.toArray('.anim-scale-in').forEach(el => {
    gsap.to(el, {
      opacity: 1,
      scale: 1,
      duration: 0.7,
      ease: 'back.out(1.5)',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none'
      }
    });
  });

  // --- Staggered Service Cards ---
  ScrollTrigger.create({
    trigger: '.services-grid',
    start: 'top 80%',
    onEnter: () => {
      gsap.from('.service-card', {
        opacity: 0,
        y: 40,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power3.out',
        clearProps: 'all',
        onComplete: () => {
          document.querySelectorAll('.service-card').forEach(el => el.classList.add('transition-enabled'));
        }
      });
    },
    once: true
  });

  // --- Staggered Product Cards ---
  ScrollTrigger.create({
    trigger: '.wholesale-grid',
    start: 'top 80%',
    onEnter: () => {
      gsap.from('.product-card', {
        opacity: 0,
        y: 40,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
        clearProps: 'all',
        onComplete: () => {
          document.querySelectorAll('.product-card').forEach(el => el.classList.add('transition-enabled'));
        }
      });
    },
    once: true
  });

  // --- Why Choose Us Cards ---
  ScrollTrigger.create({
    trigger: '.why-grid',
    start: 'top 80%',
    onEnter: () => {
      gsap.from('.why-card', {
        opacity: 0,
        x: -30,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
        clearProps: 'all',
        onComplete: () => {
          document.querySelectorAll('.why-card').forEach(el => el.classList.add('transition-enabled'));
        }
      });
    },
    once: true
  });

  // --- Area Cards ---
  ScrollTrigger.create({
    trigger: '.areas-grid',
    start: 'top 80%',
    onEnter: () => {
      gsap.from('.area-card', {
        opacity: 0,
        scale: 0.9,
        duration: 0.5,
        stagger: 0.08,
        ease: 'back.out(1.5)',
        clearProps: 'all',
        onComplete: () => {
          document.querySelectorAll('.area-card').forEach(el => el.classList.add('transition-enabled'));
        }
      });
    },
    once: true
  });

  // --- Gallery Items ---
  ScrollTrigger.create({
    trigger: '.gallery-grid',
    start: 'top 80%',
    onEnter: () => {
      gsap.from('.gallery-item', {
        opacity: 0,
        scale: 0.9,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power3.out',
        clearProps: 'all',
        onComplete: () => {
          document.querySelectorAll('.gallery-item').forEach(el => el.classList.add('transition-enabled'));
        }
      });
    },
    once: true
  });

  // --- Counter Animation ---
  const counters = document.querySelectorAll('[data-count]');
  counters.forEach(counter => {
    const target = parseInt(counter.getAttribute('data-count'));
    const suffix = counter.getAttribute('data-suffix') || '';

    ScrollTrigger.create({
      trigger: counter,
      start: 'top 90%',
      onEnter: () => {
        gsap.to(counter, {
          duration: 2,
          ease: 'power2.out',
          onUpdate: function () {
            const progress = this.progress();
            counter.textContent = Math.round(target * progress) + suffix;
          }
        });
      },
      once: true
    });
  });

  // --- Parallax effects on hero glows ---
  gsap.to('.hero-glow-1', {
    y: -60,
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1
    }
  });

  gsap.to('.hero-glow-2', {
    y: 40,
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1
    }
  });

  // --- Section Header Animations ---
  gsap.utils.toArray('.section-header').forEach(header => {
    const badge = header.querySelector('.section-badge');
    const title = header.querySelector('.section-title');
    const desc = header.querySelector('.section-desc');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: header,
        start: 'top 85%',
        toggleActions: 'play none none none'
      }
    });

    if (badge) tl.from(badge, { opacity: 0, y: 20, duration: 0.5 });
    if (title) tl.from(title, { opacity: 0, y: 30, duration: 0.6 }, '-=0.3');
    if (desc) tl.from(desc, { opacity: 0, y: 20, duration: 0.5 }, '-=0.3');
  });
}

  // Defer animation initialization until preloader fades out, or run immediately if no preloader
  const preloader = document.getElementById('preloader');
  if (preloader) {
    // Wait 2.6s (2.0s preloader timeout + 0.6s css transition time)
    setTimeout(initAnimations, 2600);
  } else {
    initAnimations();
  }
});
