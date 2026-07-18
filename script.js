/* =====================================================
   MAJUABADI — script.js
   Interactive JavaScript for animations & functionality
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ================================================
     1. PARTICLE SYSTEM
     ================================================ */
  const particleContainer = document.getElementById('particles');
  const PARTICLE_COUNT = 30;

  function createParticle() {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 4 + 1;
    const left = Math.random() * 100;
    const duration = Math.random() * 15 + 10;
    const delay = Math.random() * 10;

    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${left}%;
      bottom: -10px;
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
      opacity: 0;
    `;
    particleContainer.appendChild(p);

    // Recycle particles
    setTimeout(() => {
      p.remove();
      createParticle();
    }, (duration + delay) * 1000);
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    createParticle();
  }

  /* ================================================
     2. NAVBAR SCROLL BEHAVIOR & ACTIVE LINK
     ================================================ */
  const navbar = document.getElementById('navbar');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  function updateNavbar() {
    const scrollY = window.scrollY;

    // Scrolled class for shadow
    if (scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Active nav link
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 100;
      const bottom = top + section.offsetHeight;
      if (scrollY >= top && scrollY < bottom) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', updateNavbar, { passive: true });
  updateNavbar();

  /* ================================================
     3. HAMBURGER MENU
     ================================================ */
  const hamburger = document.getElementById('hamburger');
  const navLinksContainer = document.getElementById('navLinks');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinksContainer.classList.toggle('open');
  });

  // Close on link click
  navLinksContainer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinksContainer.classList.remove('open');
    });
  });

  /* ================================================
     4. SCROLL REVEAL ANIMATION
     ================================================ */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.reveal').forEach(el => {
    revealObserver.observe(el);
  });

  /* ================================================
     5. COUNTER ANIMATION
     ================================================ */
  function animateCounter(el, target, duration = 2000) {
    let start = 0;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.floor(eased * target);
      el.textContent = value.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = target.toLocaleString();
      }
    }
    requestAnimationFrame(update);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-count'));
        animateCounter(el, target);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count]').forEach(el => {
    counterObserver.observe(el);
  });

  /* ================================================
     6. PROJECT FILTER
     ================================================ */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      projectCards.forEach(card => {
        const category = card.getAttribute('data-category');

        if (filter === 'all' || category === filter) {
          card.style.display = '';
          card.style.opacity = '0';
          card.style.transform = 'scale(0.9)';
          setTimeout(() => {
            card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
          }, 50);
        } else {
          card.style.transition = 'opacity 0.3s ease';
          card.style.opacity = '0';
          setTimeout(() => {
            card.style.display = 'none';
          }, 300);
        }
      });
    });
  });

  /* ================================================
     7. TESTIMONIAL SLIDER
     ================================================ */
  const track = document.getElementById('testimonialTrack');
  const dotsContainer = document.getElementById('sliderDots');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const testimonials = track ? track.querySelectorAll('.testimonial-card') : [];
  let currentSlide = 0;
  let autoSlideTimer;

  if (testimonials.length > 0) {
    // Create dots
    testimonials.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Slide ${i + 1}`);
      dot.addEventListener('click', () => goToSlide(i));
      dotsContainer.appendChild(dot);
    });

    function goToSlide(index) {
      currentSlide = (index + testimonials.length) % testimonials.length;
      track.style.transform = `translateX(-${currentSlide * 100}%)`;
      document.querySelectorAll('.dot').forEach((d, i) => {
        d.classList.toggle('active', i === currentSlide);
      });
      resetAutoSlide();
    }

    function resetAutoSlide() {
      clearInterval(autoSlideTimer);
      autoSlideTimer = setInterval(() => goToSlide(currentSlide + 1), 5000);
    }

    prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));
    nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));

    // Touch/swipe support
    let touchStartX = 0;
    track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) goToSlide(diff > 0 ? currentSlide + 1 : currentSlide - 1);
    });

    resetAutoSlide();
  }

  /* ================================================
     8. CONTACT FORM
     ================================================ */
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const btn = document.getElementById('submitBtn');
      btn.querySelector('span').textContent = 'Mengirim...';
      btn.style.opacity = '0.7';
      btn.style.pointerEvents = 'none';

      // Ambil data form
      const name    = (contactForm.querySelector('#name')    || contactForm.querySelector('[name="name"]'))?.value?.trim()    || '';
      const phone   = (contactForm.querySelector('#phone')   || contactForm.querySelector('[name="phone"]'))?.value?.trim()   || '';
      const service = (contactForm.querySelector('#service') || contactForm.querySelector('[name="service"]'))?.value?.trim() || '';
      const message = (contactForm.querySelector('#message') || contactForm.querySelector('[name="message"]'))?.value?.trim() || '';

      // Susun pesan WhatsApp
      const waNumber = '6281359570251';
      const waText = [
        `*Halo MAJUABADI* 👋`,
        `Saya ingin menghubungi Anda.`,
        ``,
        `*Nama:* ${name}`,
        phone   ? `*No. HP:* ${phone}`     : '',
        service ? `*Layanan:* ${service}`  : '',
        message ? `*Pesan:* ${message}`    : '',
      ].filter(Boolean).join('\n');

      setTimeout(() => {
        // Redirect ke WhatsApp
        const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`;
        window.open(waUrl, '_blank');

        // Tampilkan pesan sukses
        contactForm.style.display = 'none';
        formSuccess.style.display = 'block';
        formSuccess.style.opacity = '0';
        formSuccess.style.transform = 'scale(0.9)';
        setTimeout(() => {
          formSuccess.style.transition = 'all 0.5s ease';
          formSuccess.style.opacity = '1';
          formSuccess.style.transform = 'scale(1)';
        }, 50);
      }, 800);
    });

    // Input focus effects
    const inputs = contactForm.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        const label = input.parentElement.querySelector('label');
        if (label) label.style.color = '#D4A843';
      });
      input.addEventListener('blur', () => {
        const label = input.parentElement.querySelector('label');
        if (label) label.style.color = '';
      });
    });
  }

  /* ================================================
     9. BACK TO TOP BUTTON
     ================================================ */
  const backToTop = document.getElementById('backToTop');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  }, { passive: true });

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ================================================
     10. SMOOTH SCROLL FOR ALL ANCHOR LINKS
     ================================================ */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ================================================
     11. SERVICE CARD HOVER ICON EFFECT
     ================================================ */
  document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      const icon = card.querySelector('.service-icon-wrap');
      if (icon) {
        icon.style.transform = 'scale(1.1) rotate(-5deg)';
      }
    });
    card.addEventListener('mouseleave', () => {
      const icon = card.querySelector('.service-icon-wrap');
      if (icon) {
        icon.style.transform = '';
      }
    });
  });

  /* ================================================
     12. HERO PARALLAX
     ================================================ */
  const heroBg = document.querySelector('.hero-bg');
  window.addEventListener('scroll', () => {
    if (heroBg) {
      const scrollY = window.scrollY;
      heroBg.style.transform = `translateY(${scrollY * 0.4}px)`;
    }
  }, { passive: true });

  /* ================================================
     13. TYPING CURSOR EFFECT ON HERO BADGE
     ================================================ */
  // Add subtle shimmer to gold elements
  const goldElements = document.querySelectorAll('.nav-cta, .btn-primary');
  goldElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      el.style.transition = 'all 0.3s ease';
    });
  });

  /* ================================================
     14. STATS BAR HOVER
     ================================================ */
  document.querySelectorAll('.stat-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      const num = item.querySelector('.stat-num');
      if (num) {
        num.style.color = '#D4A843';
        num.style.transform = 'scale(1.1)';
        num.style.transition = 'all 0.3s ease';
      }
    });
    item.addEventListener('mouseleave', () => {
      const num = item.querySelector('.stat-num');
      if (num) {
        num.style.color = '';
        num.style.transform = '';
      }
    });
  });

  /* ================================================
     15. CURSOR TRAIL EFFECT (desktop only)
     ================================================ */
  if (window.innerWidth > 768) {
    const trail = [];
    const TRAIL_COUNT = 6;

    for (let i = 0; i < TRAIL_COUNT; i++) {
      const dot = document.createElement('div');
      dot.style.cssText = `
        position: fixed;
        width: ${6 - i}px;
        height: ${6 - i}px;
        background: rgba(212, 168, 67, ${0.6 - i * 0.1});
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        transition: left 0.05s ease, top 0.05s ease;
        opacity: 0;
      `;
      document.body.appendChild(dot);
      trail.push({ el: dot, x: 0, y: 0 });
    }

    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      trail[0].x = mouseX;
      trail[0].y = mouseY;
      trail[0].el.style.opacity = '1';
    });

    function animateTrail() {
      for (let i = 1; i < TRAIL_COUNT; i++) {
        trail[i].x += (trail[i - 1].x - trail[i].x) * 0.35;
        trail[i].y += (trail[i - 1].y - trail[i].y) * 0.35;
        trail[i].el.style.left = `${trail[i].x - 3}px`;
        trail[i].el.style.top = `${trail[i].y - 3}px`;
        trail[i].el.style.opacity = `${0.5 - i * 0.08}`;
      }
      trail[0].el.style.left = `${trail[0].x - 3}px`;
      trail[0].el.style.top = `${trail[0].y - 3}px`;
      requestAnimationFrame(animateTrail);
    }
    animateTrail();
  }

  /* ================================================
     16. INTERACTIVE 3D WINDOW EFFECT
     ================================================ */
  const visual3dContainer = document.querySelector('.about-visual-3d');
  const window3d = document.querySelector('.window-3d');

  if (visual3dContainer && window3d) {
    visual3dContainer.addEventListener('mousemove', (e) => {
      const rect = visual3dContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Calculate rotation based on mouse distance from center
      const rotateX = ((y - centerY) / centerY) * -5; 
      const rotateY = ((x - centerX) / centerX) * 5;
      
      window3d.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    visual3dContainer.addEventListener('mouseleave', () => {
      window3d.style.transform = `rotateX(0deg) rotateY(0deg)`;
      window3d.style.transition = 'transform 0.5s ease-out';
    });
    
    visual3dContainer.addEventListener('mouseenter', () => {
      window3d.style.transition = 'transform 0.1s ease-out';
    });
  }

  console.log('%c MAJUABADI 🏗️ ', 'background: #D4A843; color: #000; font-size: 18px; font-weight: bold; padding: 8px 16px; border-radius: 4px;');
  console.log('%c Website berhasil dimuat!', 'color: #D4A843; font-size: 12px;');

});
