document.addEventListener('DOMContentLoaded', () => {
  const particleContainer = document.getElementById('particles');
  if (particleContainer) {
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = Math.random() * 4 + 1;
      p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;bottom:-10px;animation-duration:${Math.random()*15+10}s;animation-delay:${Math.random()*10}s;`;
      particleContainer.appendChild(p);
    }
  }

  const navbar = document.getElementById('navbar');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  function updateNavbar() {
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 110;
      const bottom = top + section.offsetHeight;
      if (window.scrollY >= top && window.scrollY < bottom) current = section.id;
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  }
  window.addEventListener('scroll', updateNavbar, {passive:true});
  updateNavbar();

  const hamburger = document.getElementById('hamburger');
  const navLinksContainer = document.getElementById('navLinks');
  if (hamburger && navLinksContainer) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      navLinksContainer.classList.toggle('open');
    });
    navLinksContainer.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinksContainer.classList.remove('open');
    }));
  }

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, {threshold:.12, rootMargin:'0px 0px -50px 0px'});
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  function animateCounter(el, target, duration=1800) {
    const startTime = performance.now();
    function update(now) {
      const progress = Math.min((now-startTime)/duration, 1);
      const eased = 1-Math.pow(1-progress,3);
      el.textContent = Math.floor(eased*target).toLocaleString();
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }
  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      animateCounter(el, parseInt(el.dataset.count,10));
      counterObserver.unobserve(el);
    });
  }, {threshold:.5});
  document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));

  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');
  filterBtns.forEach(btn => btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    projectCards.forEach(card => card.classList.toggle('hidden', filter !== 'all' && card.dataset.category !== filter));
  }));

  document.querySelectorAll('.tour-link').forEach(link => {
    link.addEventListener('click', () => {
      sessionStorage.setItem('selectedTourService', link.dataset.tour || '');
    });
  });

  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('name').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const service = document.getElementById('service').value;
      const message = document.getElementById('message').value.trim();
      const text = `Halo Maju Abadi Group,%0A%0ANama: ${encodeURIComponent(name)}%0ANo. WhatsApp: ${encodeURIComponent(phone)}%0AKebutuhan: ${encodeURIComponent(service)}%0APesan: ${encodeURIComponent(message)}`;
      window.open(`https://wa.me/6285100511753?text=${text}`, '_blank');
    });
  }

  const backTop = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    if (backTop) backTop.classList.toggle('visible', window.scrollY > 500);
  }, {passive:true});
  if (backTop) backTop.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));

  const visual3d = document.querySelector('.about-visual-3d');
  const window3d = document.querySelector('.window-3d');
  if (visual3d && window3d && window.matchMedia('(pointer:fine)').matches) {
    visual3d.addEventListener('mousemove', e => {
      const rect = visual3d.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - .5;
      const y = (e.clientY - rect.top) / rect.height - .5;
      window3d.style.transform = `rotateX(${y*-6}deg) rotateY(${x*6}deg)`;
    });
    visual3d.addEventListener('mouseleave', () => window3d.style.transform = 'rotateX(0) rotateY(0)');
  }

  const selectedTour = sessionStorage.getItem('selectedTourService');
  const serviceSelect = document.getElementById('service');
  if (selectedTour && serviceSelect) serviceSelect.value = 'Tour & Travel';


  /* =========================================================
     TESTIMONIAL SYSTEM
     Backend: Google Apps Script + Google Sheets
     Ganti URL di bawah setelah Web App Apps Script dibuat.
     ========================================================= */
  const TESTIMONIAL_API_URL = 'https://script.google.com/macros/s/AKfycbyBAomfPL16-HKqwD05cW5OTDx812ctTbw0pc-cJKSQgom9tJ6Y7DVAq5Ygh5gJ5219/exec';

  const testimonialList = document.getElementById('testimonialList');
  const testimonialFormWrap = document.getElementById('testimonialFormWrap');
  const openTestimonialForm = document.getElementById('openTestimonialForm');
  const closeTestimonialForm = document.getElementById('closeTestimonialForm');
  const cancelTestimonial = document.getElementById('cancelTestimonial');
  const testimonialForm = document.getElementById('testimonialForm');
  const testimonialStatus = document.getElementById('testimonialFormStatus');
  const testimonialSubmit = document.getElementById('testimonialSubmit');
  const testimonialMessage = document.getElementById('testimonialMessage');
  const testimonialCharCount = document.getElementById('testimonialCharCount');

  function setTestimonialStatus(message, type = '') {
    if (!testimonialStatus) return;
    testimonialStatus.textContent = message;
    testimonialStatus.className = `testimonial-form-status ${type}`.trim();
  }

  function openTestimonialPanel() {
    if (!testimonialFormWrap) return;
    testimonialFormWrap.hidden = false;
    testimonialFormWrap.scrollIntoView({behavior:'smooth', block:'center'});
    setTimeout(() => document.getElementById('testimonialName')?.focus(), 350);
  }

  function closeTestimonialPanel() {
    if (!testimonialFormWrap) return;
    testimonialFormWrap.hidden = true;
    setTestimonialStatus('');
  }

  if (openTestimonialForm) openTestimonialForm.addEventListener('click', openTestimonialPanel);
  if (closeTestimonialForm) closeTestimonialForm.addEventListener('click', closeTestimonialPanel);
  if (cancelTestimonial) cancelTestimonial.addEventListener('click', closeTestimonialPanel);

  if (testimonialMessage && testimonialCharCount) {
    const updateCount = () => {
      testimonialCharCount.textContent = testimonialMessage.value.length;
    };
    testimonialMessage.addEventListener('input', updateCount);
    updateCount();
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function renderStars(rating) {
    const n = Math.max(1, Math.min(5, Number(rating) || 5));
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  function renderTestimonials(items) {
    if (!testimonialList) return;
    const safeItems = Array.isArray(items) ? items : [];

    if (!safeItems.length) {
      testimonialList.innerHTML = `
        <article class="testimonial-card">
          <div class="quote-icon">"</div>
          <div class="testimonial-stars">★★★★★</div>
          <p class="testimonial-text">Jadilah salah satu klien pertama yang berbagi pengalaman bersama Maju Abadi Group.</p>
          <div class="testimonial-author">
            <div class="author-avatar">MA</div>
            <div><strong>Maju Abadi Group</strong><small>Klien Kami</small></div>
          </div>
        </article>`;
      return;
    }

    testimonialList.innerHTML = safeItems.map(item => {
      const name = escapeHtml(item.name || 'Klien');
      const org = escapeHtml(item.organization || 'Klien Maju Abadi Group');
      const message = escapeHtml(item.message || '');
      const rating = Math.max(1, Math.min(5, Number(item.rating) || 5));
      const initials = escapeHtml(
        String(item.name || 'K').trim().split(/\s+/).slice(0,2).map(v => v[0]).join('').toUpperCase()
      );

      return `
        <article class="testimonial-card">
          <div class="quote-icon">"</div>
          <div class="testimonial-stars" aria-label="${rating} dari 5 bintang">${renderStars(rating)}</div>
          <p class="testimonial-text">${message}</p>
          <div class="testimonial-author">
            <div class="author-avatar">${initials}</div>
            <div><strong>${name}</strong><small>${org}</small></div>
          </div>
        </article>`;
    }).join('');
  }

  async function loadTestimonials() {
    if (!testimonialList) return;
    if (!TESTIMONIAL_API_URL || TESTIMONIAL_API_URL.includes('PASTE_GOOGLE')) return;

    try {
      const response = await fetch(`${TESTIMONIAL_API_URL}?action=list&t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store'
      });
      if (!response.ok) throw new Error('Gagal mengambil testimoni.');
      const data = await response.json();

      if (data.ok && Array.isArray(data.testimonials)) {
        renderTestimonials(data.testimonials);
      }
    } catch (error) {
      console.warn('Testimoni online belum dapat dimuat:', error);
    }
  }

  if (testimonialForm) {
    testimonialForm.addEventListener('submit', async event => {
      event.preventDefault();

      const name = document.getElementById('testimonialName')?.value.trim() || '';
      const organization = document.getElementById('testimonialOrg')?.value.trim() || '';
      const message = testimonialMessage?.value.trim() || '';
      const website = document.getElementById('testimonialWebsite')?.value.trim() || '';
      const rating = Number(testimonialForm.querySelector('input[name="rating"]:checked')?.value || 5);

      if (!name || !message) {
        setTestimonialStatus('Nama dan testimoni wajib diisi.', 'error');
        return;
      }

      if (name.length > 80 || organization.length > 100 || message.length > 600) {
        setTestimonialStatus('Data terlalu panjang. Mohon periksa kembali isian Anda.', 'error');
        return;
      }

      if (website) {
        setTestimonialStatus('Terima kasih.', 'success');
        testimonialForm.reset();
        return;
      }

      if (!TESTIMONIAL_API_URL || TESTIMONIAL_API_URL.includes('PASTE_GOOGLE')) {
        setTestimonialStatus('Form sudah terpasang, tetapi alamat Google Apps Script belum dihubungkan. Ganti TESTIMONIAL_API_URL di script.js.', 'info');
        return;
      }

      testimonialSubmit.disabled = true;
      testimonialSubmit.style.opacity = '.65';
      setTestimonialStatus('Mengirim testimoni...', 'info');

      const payload = {
        action: 'submit',
        name,
        organization,
        rating,
        message,
        website
      };

      try {
        // Gunakan GET untuk pengiriman ke Apps Script.
        // Ini menghindari masalah CORS/redirect POST pada GitHub Pages.
        const submitUrl = new URL(TESTIMONIAL_API_URL);
        submitUrl.searchParams.set('action', 'submit');
        submitUrl.searchParams.set('name', name);
        submitUrl.searchParams.set('organization', organization);
        submitUrl.searchParams.set('rating', String(rating));
        submitUrl.searchParams.set('message', message);
        if (website) submitUrl.searchParams.set('website', website);

        // Apps Script ContentService dapat mengarahkan response ke
        // script.googleusercontent.com. Dari GitHub Pages, gunakan no-cors
        // agar request GET tetap terkirim tanpa diblokir browser.
        await fetch(submitUrl.toString(), {
          method: 'GET',
          mode: 'no-cors',
          cache: 'no-store'
        });

        testimonialForm.reset();
        if (testimonialCharCount) testimonialCharCount.textContent = '0';

        // Langsung tampilkan testimoni baru tanpa menunggu approval manual.
        const newTestimonial = {
          name,
          organization,
          rating,
          message
        };

        const currentCards = testimonialList
          ? Array.from(testimonialList.querySelectorAll('.testimonial-card'))
          : [];

        // Render testimoni baru di paling depan.
        const currentItems = currentCards.map(card => ({
          name: card.querySelector('.testimonial-author strong')?.textContent || '',
          organization: card.querySelector('.testimonial-author small')?.textContent || '',
          message: card.querySelector('.testimonial-text')?.textContent || '',
          rating: (card.querySelector('.testimonial-stars')?.textContent.match(/★/g) || []).length
        }));

        renderTestimonials([newTestimonial, ...currentItems]);
        setTestimonialStatus('Terima kasih! Testimoni Anda sudah tampil di website.', 'success');

        setTimeout(() => {
          closeTestimonialPanel();
        }, 2200);
      } catch (error) {
        console.error(error);
        setTestimonialStatus('Testimoni belum terkirim. Silakan coba lagi beberapa saat lagi.', 'error');
      } finally {
        testimonialSubmit.disabled = false;
        testimonialSubmit.style.opacity = '';
      }
    });
  }

  loadTestimonials();

  console.log('%c MAJU ABADI GROUP ', 'background:#D4A843;color:#000;font-weight:800;padding:8px 14px;border-radius:4px;');
});

// Testimonial data is loaded from the approved Google Sheets records.\n
