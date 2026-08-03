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

  console.log('%c MAJU ABADI GROUP ', 'background:#D4A843;color:#000;font-weight:800;padding:8px 14px;border-radius:4px;');
});

// Group company cards are static and require no database.\n
