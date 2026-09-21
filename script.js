/**
 * Pilgrim's Nest — Official Interactive Script
 * Domain: pilgrimsnest.org
 */

document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initCountdown();
  initWaitlist();
  initReflections();
  initAccordion();
  initContactModal();
  initHeroLogoParallax();
});

/* ==========================================================================
   1. Ambient Starlight & Floating Embers Canvas
   ========================================================================== */
function initParticles() {
  const canvas = document.getElementById('starCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  // Generate particle mix: celestial stars + warm hearth embers
  const count = window.innerWidth < 768 ? 45 : 90;
  for (let i = 0; i < count; i++) {
    const isEmber = Math.random() > 0.65;
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: isEmber ? Math.random() * 2.2 + 0.8 : Math.random() * 1.5 + 0.5,
      speedX: (Math.random() - 0.5) * (isEmber ? 0.3 : 0.1),
      speedY: isEmber ? -(Math.random() * 0.4 + 0.15) : (Math.random() - 0.5) * 0.1,
      alpha: Math.random() * 0.7 + 0.2,
      maxAlpha: isEmber ? 0.85 : 0.75,
      pulseSpeed: Math.random() * 0.02 + 0.005,
      pulseDir: 1,
      type: isEmber ? 'ember' : 'star',
      color: isEmber ? 'rgba(245, 158, 11,' : 'rgba(254, 243, 199,'
    });
  }

  // Mouse interaction
  let mouse = { x: -1000, y: -1000, active: false };
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });
  window.addEventListener('mouseleave', () => {
    mouse.active = false;
  });

  function render() {
    ctx.clearRect(0, 0, width, height);

    for (let p of particles) {
      // Pulse brightness
      p.alpha += p.pulseSpeed * p.pulseDir;
      if (p.alpha > p.maxAlpha) {
        p.alpha = p.maxAlpha;
        p.pulseDir = -1;
      } else if (p.alpha < 0.15) {
        p.alpha = 0.15;
        p.pulseDir = 1;
      }

      if (!prefersReducedMotion) {
        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap around borders
        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        } else if (p.y > height) {
          p.y = 0;
        }

        if (p.x < 0) p.x = width;
        else if (p.x > width) p.x = 0;

        // Gentle mouse avoidance
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            p.x += (dx / dist) * 1.5;
            p.y += (dy / dist) * 1.5;
          }
        }
      }

      // Draw particle with glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `${p.color} ${p.alpha})`;
      ctx.shadowBlur = p.type === 'ember' ? 8 : 4;
      ctx.shadowColor = p.type === 'ember' ? '#F59E0B' : '#FEF3C7';
      ctx.fill();
    }

    requestAnimationFrame(render);
  }

  render();
}

/* ==========================================================================
   2. Real-Time Launch Countdown
   ========================================================================== */
function initCountdown() {
  // Target: Autumn 2026 Welcoming (extended by 3 days)
  const targetDate = new Date('2026-09-25T00:00:00Z').getTime();

  const daysEl = document.getElementById('cdDays');
  const hoursEl = document.getElementById('cdHours');
  const minutesEl = document.getElementById('cdMinutes');
  const secondsEl = document.getElementById('cdSeconds');

  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  function updateClock() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    daysEl.textContent = String(days).padStart(2, '0');
    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');
  }

  updateClock();
  setInterval(updateClock, 1000);
}

/* ==========================================================================
   3. Founding Wayfarers Waitlist Form
   ========================================================================== */
function initWaitlist() {
  const form = document.getElementById('waitlistForm');
  const emailInput = document.getElementById('waitlistEmail');
  const submitBtn = document.getElementById('waitlistSubmit');

  if (!form || !emailInput || !submitBtn) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();

    if (!validateEmail(email)) {
      showToast('⚠️ Please provide a valid email address.', 'warning');
      emailInput.focus();
      return;
    }

    // Button loading state
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Joining Circle...</span>`;

    setTimeout(() => {
      // Store in localStorage for demonstration and persistency
      try {
        const existing = JSON.parse(localStorage.getItem('pilgrims_nest_subscribers') || '[]');
        if (!existing.includes(email)) {
          existing.push(email);
          localStorage.setItem('pilgrims_nest_subscribers', JSON.stringify(existing));
        }
      } catch (err) {
        console.warn('Storage error:', err);
      }

      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      emailInput.value = '';

      showToast('✨ Welcome to the Founding Circle. You will be notified the moment our sanctuary opens!', 'success');
    }, 700);
  });
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ==========================================================================
   4. Wayfarer's Contemplations & Wisdom Rotator
   ========================================================================== */
const reflections = [
  {
    quote: "Sanctuary is not merely a destination at the road's end; it is the stillness we bring into each step of the journey.",
    author: "Wayfarer's Rule"
  },
  {
    quote: "In every walk with nature, one receives far more than he seeks.",
    author: "John Muir"
  },
  {
    quote: "Silence is the language of God, all else is poor translation.",
    author: "Rumi"
  },
  {
    quote: "A journey of a thousand miles begins beneath the sole of a single shoe.",
    author: "Lao Tzu"
  },
  {
    quote: "Tell me, what is it you plan to do with your one wild and precious life?",
    author: "Mary Oliver"
  },
  {
    quote: "It is not the mountain we conquer, but ourselves.",
    author: "Sir Edmund Hillary"
  },
  {
    quote: "The hearth fire warms not only the traveler’s hands, but kindles the kinship of the soul.",
    author: "Pilgrim's Nest Ledger"
  }
];

let currentReflectionIndex = 0;

function initReflections() {
  const textEl = document.getElementById('reflectionText');
  const authorEl = document.getElementById('reflectionAuthor');
  const btn = document.getElementById('reflectBtn');

  if (!textEl || !authorEl || !btn) return;

  btn.addEventListener('click', () => {
    // Fade out
    textEl.style.opacity = '0';
    textEl.style.transform = 'translateY(8px)';
    authorEl.style.opacity = '0';

    setTimeout(() => {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * reflections.length);
      } while (nextIndex === currentReflectionIndex && reflections.length > 1);

      currentReflectionIndex = nextIndex;
      const ref = reflections[currentReflectionIndex];

      textEl.textContent = `“${ref.quote}”`;
      authorEl.textContent = `— ${ref.author}`;

      // Fade in
      textEl.style.opacity = '1';
      textEl.style.transform = 'translateY(0)';
      authorEl.style.opacity = '1';
    }, 350);
  });
}

/* ==========================================================================
   5. FAQ Accordion
   ========================================================================== */
function initAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    const answerEl = item.querySelector('.faq-answer');

    if (!questionBtn || !answerEl) return;

    questionBtn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close all other items
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('open');
          const otherAnswer = otherItem.querySelector('.faq-answer');
          if (otherAnswer) otherAnswer.style.maxHeight = null;
        }
      });

      // Toggle current
      if (isOpen) {
        item.classList.remove('open');
        answerEl.style.maxHeight = null;
      } else {
        item.classList.add('open');
        answerEl.style.maxHeight = answerEl.scrollHeight + 'px';
      }
    });
  });
}

/* ==========================================================================
   6. Contact Modal
   ========================================================================== */
function initContactModal() {
  const modal = document.getElementById('contactModal');
  const openBtns = document.querySelectorAll('[data-open-modal="contactModal"]');
  const closeBtn = document.getElementById('closeModalBtn');
  const form = document.getElementById('contactForm');

  if (!modal) return;

  function openModal() {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  openBtns.forEach(btn => btn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  }));

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  // Click outside to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // ESC key to close
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      closeModal();
      form.reset();
      showToast('🕊️ Your message has been received by the Pilgrim’s Nest stewards. We will be in touch soon.', 'success');
    });
  }
}

/* ==========================================================================
   7. Toast Notification Utility
   ========================================================================== */
function showToast(message, type = 'info') {
  let toast = document.getElementById('siteToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'siteToast';
    toast.className = 'toast-msg';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<span>${message}</span>`;
  toast.classList.add('show');

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 4500);
}

/* ==========================================================================
   8. Hero Logo Interactive 3D Perspective Tilt
   ========================================================================== */
function initHeroLogoParallax() {
  const logo = document.querySelector('.hero-logo-img');
  const wrap = document.querySelector('.hero-emblem-wrap');
  if (!logo || !wrap) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  wrap.addEventListener('mousemove', (e) => {
    const rect = wrap.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateX = (-y / (rect.height / 2)) * 14;
    const rotateY = (x / (rect.width / 2)) * 14;
    logo.style.transform = `perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale(1.05)`;
  });

  wrap.addEventListener('mouseleave', () => {
    logo.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)';
  });
}
