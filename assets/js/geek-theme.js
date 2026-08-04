// Geek Theme JavaScript - Enhanced Interactions and Effects
// Keep BFCache restores smooth (no forced reload on browser back/forward)
window.addEventListener('pageshow', () => {
  try {
    sessionStorage.removeItem('forceReload');
  } catch { }
});

function resolveSitePath(pathFromRoot) {
  const normalized = String(pathFromRoot || '').replace(/^\/+/, '');
  const scripts = document.getElementsByTagName('script');
  for (let i = scripts.length - 1; i >= 0; i--) {
    const src = scripts[i].getAttribute('src');
    if (!src || !/assets\/js\/geek-theme\.js(\?|#|$)/.test(src)) continue;
    try {
      const parsed = new URL(src, window.location.href);
      const basePath = parsed.pathname.replace(/assets\/js\/geek-theme\.js$/, '');
      return basePath + normalized;
    } catch (e) { }
  }
  const splitMark = '/pages/';
  if (window.location.pathname.indexOf(splitMark) !== -1) {
    const prefix = window.location.pathname.split(splitMark)[0];
    return prefix + '/' + normalized;
  }
  return '/' + normalized;
}

class GeekTheme {
  constructor() {
    this.init();
  }

  init() {
    const canEffects = !(window.AppEffects && (window.AppEffects.isReduced() || !window.AppEffects.isEnabled()));
    if (canEffects) this.setupParticleNetwork();
    if (canEffects) this.setupScrollEffects();
    if (canEffects) this.setupTypingEffects();
    if (canEffects) this.setupGlitchEffects();
    if (canEffects) this.setupTerminalEffects();
  }

  // Particle Network Effect — floating particles that connect with lines
  setupParticleNetwork() {
    if (document.getElementById('particleNetworkBg')) return;
    const canvas = document.createElement('canvas');
    canvas.id = 'particleNetworkBg';
    canvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:-1;';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d', { alpha: true });

    let particles = [];
    const connectionDistance = 140;
    const mouseConnectionDistance = 200;
    let mouseX = -9999, mouseY = -9999;
    let isOnPage = false;
    let accentColor = '#00c768';

    const parseColor = (str) => {
      const el = document.createElement('div');
      el.style.color = str;
      document.body.appendChild(el);
      const computed = getComputedStyle(el).color;
      document.body.removeChild(el);
      const m = computed.match(/(\d+)/g);
      return m ? { r: +m[0], g: +m[1], b: +m[2] } : { r: 0, g: 199, b: 104 };
    };

    let colorRGB = parseColor(accentColor);

    const syncColor = () => {
      const c = getComputedStyle(document.documentElement).getPropertyValue('--accent-green').trim();
      accentColor = c || '#00c768';
      colorRGB = parseColor(accentColor);
    };

    const initParticles = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      const num = Math.min(Math.floor((canvas.width * canvas.height) / 10000), 150);
      for (let i = 0; i < num; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2,
          radius: Math.random() * 1.5 + 0.5
        });
      }
    };

    syncColor();
    initParticles();
    window.addEventListener('resize', GeekTheme.debounce(initParticles, 250));
    window.addEventListener('themechange', syncColor);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncColor);

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      isOnPage = true;
    });
    document.addEventListener('mouseleave', () => {
      isOnPage = false;
    });

    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${colorRGB.r},${colorRGB.g},${colorRGB.b},0.6)`;
        ctx.fill();

        if (isOnPage) {
          const dx = mouseX - p.x;
          const dy = mouseY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouseConnectionDistance) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouseX, mouseY);
            ctx.strokeStyle = `rgba(${colorRGB.r},${colorRGB.g},${colorRGB.b},${0.35 * (1 - dist / mouseConnectionDistance)})`;
            ctx.stroke();
            
            // Subtle attraction to cursor
            p.x += dx * 0.005;
            p.y += dy * 0.005;
          }
        }

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${colorRGB.r},${colorRGB.g},${colorRGB.b},${0.15 * (1 - dist / connectionDistance)})`;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };

    let isCanvasVisible = true;
    if ('IntersectionObserver' in window) {
      const canvasObserver = new IntersectionObserver((entries) => {
        isCanvasVisible = entries[0].isIntersecting;
        if (isCanvasVisible && !document.hidden) {
          if (!animId) animId = requestAnimationFrame(draw);
        } else {
          if (animId) { cancelAnimationFrame(animId); animId = null; }
        }
      }, { rootMargin: '200px' });
      canvasObserver.observe(canvas);
    } else {
      animId = requestAnimationFrame(draw);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden || !isCanvasVisible) { 
        if (animId) { cancelAnimationFrame(animId); animId = null; }
      } else {
        if (!animId) animId = requestAnimationFrame(draw);
      }
    });
  }

  // Scroll Effects
  setupScrollEffects() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          entry.target.addEventListener('animationend', () => {
            entry.target.classList.remove('animate-in');
          }, { once: true });
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all cards and sections (排除有reveal类的元素，避免动画冲突)
    document.querySelectorAll('.card, .article-card:not(.reveal), .skill-card:not(.reveal), .terminal-window:not(.reveal)').forEach(el => {
      observer.observe(el);
    });

    // Parallax effect for hero sections
    const parallaxElements = document.querySelectorAll('.hero-section, .article-hero');
    if (parallaxElements.length > 0) {
      const onScroll = () => {
        const scrolled = window.pageYOffset;
        parallaxElements.forEach(element => {
          const speed = 0.5;
          element.style.transform = `translateY(${scrolled * speed}px)`;
        });
      };
      window.addEventListener('scroll', GeekTheme.throttle(onScroll, 16), { passive: true });
    }
  }

  // Typing Effects
  setupTypingEffects() {
    const typingElements = document.querySelectorAll('.typing-effect');

    typingElements.forEach(element => {
      const text = element.textContent;
      element.textContent = '';
      element.style.borderRight = '2px solid var(--accent-green)';

      let i = 0;
      const typeWriter = () => {
        if (i < text.length) {
          element.textContent += text.charAt(i);
          i++;
          setTimeout(typeWriter, 100);
        } else {
          element.style.borderRight = 'none';
        }
      };

      // Start typing when element is visible
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            typeWriter();
            observer.unobserve(entry.target);
          }
        });
      });

      observer.observe(element);
    });
  }

  // Glitch Effects
  setupGlitchEffects() {
    const glitchElements = document.querySelectorAll('.glitch');

    glitchElements.forEach(element => {
      let glitchInterval;

      const startGlitch = () => {
        glitchInterval = setInterval(() => {
          element.style.transform = `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`;
        }, 50);
      };

      const stopGlitch = () => {
        clearInterval(glitchInterval);
        element.style.transform = 'translate(0, 0)';
      };

      element.addEventListener('mouseenter', startGlitch);
      element.addEventListener('mouseleave', stopGlitch);
    });
  }

  // Terminal Effects
  setupTerminalEffects() {
    const terminalWindows = document.querySelectorAll('.terminal-window');

    terminalWindows.forEach(terminal => {
      // Add cursor blink effect
      const cursor = terminal.querySelector('.typing-cursor');
      if (cursor) {
        setInterval(() => {
          cursor.style.opacity = cursor.style.opacity === '0' ? '1' : '0';
        }, 500);
      }
    });
  }

  // Utility Functions
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static throttle(func, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

// Enhanced Navigation
class EnhancedNavigation {
  constructor() {
    this.nav = document.querySelector('.nav-container');
    this.mobileToggle = document.querySelector('.mobile-menu-toggle');
    this.navMenu = document.querySelector('.nav-menu');
    this.init();
  }

  init() {
    this.setupMobileMenu();
    this.setupScrollEffects();
    this.setupActiveLink();
  }

  setupMobileMenu() {
    if (!this.mobileToggle || !this.navMenu) return;

    this.mobileToggle.addEventListener('click', () => {
      this.mobileToggle.classList.toggle('active');
      this.navMenu.classList.toggle('active');
      document.body.classList.toggle('nav-open');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.nav.contains(e.target)) {
        this.mobileToggle.classList.remove('active');
        this.navMenu.classList.remove('active');
        document.body.classList.remove('nav-open');
      }
    });

    // Close menu when clicking on links
    const navLinks = this.navMenu.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        this.mobileToggle.classList.remove('active');
        this.navMenu.classList.remove('active');
        document.body.classList.remove('nav-open');
      });
    });
  }

  setupScrollEffects() {
    if (!this.nav) return;

    const handleScroll = GeekTheme.throttle(() => {
      if (window.scrollY > 20) {
        this.nav.style.boxShadow = 'var(--shadow-md)';
      } else {
        this.nav.style.boxShadow = 'var(--shadow-sm)';
      }
    }, 16);

    window.addEventListener('scroll', handleScroll);
    handleScroll();
  }

  setupActiveLink() {
    const currentPath = window.location.pathname;
    const navLinks = this.navMenu?.querySelectorAll('a');

    if (navLinks) {
      navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath.split('/').pop()) {
          link.classList.add('active');
        }
      });
    }
  }
}

// Enhanced Cards
class EnhancedCards {
  constructor() {
    this.init();
  }

  init() {
    this.setupCardHoverEffects();
    this.setupCardAnimations();
  }

  setupCardHoverEffects() {
    // CSS handles all hover effects; no JS box-shadow overrides needed
  }

  setupCardAnimations() {
    // 排除已经有reveal类的卡片，避免动画冲突
    const cards = document.querySelectorAll('.card, .article-card');
    const skillCards = document.querySelectorAll('.skill-card:not(.reveal)');
    const allCards = [...cards, ...skillCards];

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1 });

    allCards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(card);
    });
  }
}

// Enhanced Buttons
class EnhancedButtons {
  constructor() {
    this.init();
  }

  init() {
    this.setupButtonEffects();
    this.setupRippleEffect();
  }

  setupButtonEffects() {
    // CSS handles all button hover effects; no JS box-shadow overrides needed
  }

  setupRippleEffect() {
    const buttons = document.querySelectorAll('.btn:not(.no-ripple), .action-btn:not(.no-ripple), .article-button:not(.no-ripple)');

    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.cssText = `
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          left: ${x}px;
          top: ${y}px;
          background: rgba(0, 255, 65, 0.3);
          border-radius: 50%;
          transform: scale(0);
          animation: ripple 0.6s linear;
          pointer-events: none;
        `;

        button.style.position = 'relative';
        button.appendChild(ripple);

        setTimeout(() => {
          ripple.remove();
        }, 600);
      });
    });
  }
}

// Language Toggle Button — injected before theme toggle in .nav-content
class LangToggle {
  constructor() {
    this.btn = null;
    this.init();
  }

  init() {
    this.injectButton();
    this.updateButton();
    window.addEventListener('langchange', () => this.updateButton());
  }

  injectButton() {
    const navContent = document.querySelector('.nav-content');
    if (!navContent) return;

    const btn = document.createElement('button');
    btn.className = 'lang-toggle';
    btn.id = 'langToggle';

    btn.addEventListener('click', () => {
      if (!window.LangManager) return;
      window.LangManager.cycle();
    });

    // Insert before theme toggle if it exists, else before mobile toggle
    const themeToggle = document.getElementById('themeToggle');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    if (themeToggle) {
      navContent.insertBefore(btn, themeToggle);
    } else if (mobileToggle) {
      navContent.insertBefore(btn, mobileToggle);
    } else {
      navContent.appendChild(btn);
    }
    this.btn = btn;
  }

  updateButton() {
    if (!this.btn) return;
    const lang = window.LangManager ? window.LangManager.get() : 'en';
    if (lang === 'zh') {
      this.btn.textContent = 'EN';
      this.btn.title = 'Switch to English';
    } else {
      this.btn.textContent = '中';
      this.btn.title = '切换为中文';
    }
  }
}

// Theme Toggle Button — injected as last item in .nav-menu
class ThemeToggle {
  constructor() {
    this.btn = null;
    this.init();
  }

  init() {
    this.injectButton();
    this.updateButton();
    window.addEventListener('themechange', () => this.updateButton());
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (!document.documentElement.getAttribute('data-theme')) this.updateButton();
    });
  }

  injectButton() {
    const navContent = document.querySelector('.nav-content');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    if (!navContent) return;

    const btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.id = 'themeToggle';

    btn.addEventListener('click', () => {
      if (!window.ThemeManager) return;
      const rect = btn.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      window.ThemeManager.cycle(x, y);
    });

    if (mobileToggle) {
      navContent.insertBefore(btn, mobileToggle);
    } else {
      navContent.appendChild(btn);
    }
    this.btn = btn;
  }

  updateButton() {
    if (!this.btn) return;
    const eff = window.ThemeManager
      ? window.ThemeManager.getEffective()
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    if (eff === 'dark') {
      this.btn.innerHTML = ThemeToggle.ICON_SUN;
      this.btn.title = 'Switch to light mode';
    } else {
      this.btn.innerHTML = ThemeToggle.ICON_MOON;
      this.btn.title = 'Switch to dark mode';
    }
  }

  static get ICON_SUN() {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">' +
      '<circle cx="12" cy="12" r="5"/>' +
      '<line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>' +
      '<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>' +
      '<line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>' +
      '<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>' +
      '</svg>';
  }

  static get ICON_MOON() {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">' +
      '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>' +
      '</svg>';
  }
}

// Initialize all enhancements when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new GeekTheme();
  new EnhancedNavigation();
  new EnhancedCards();
  new EnhancedButtons();
  new ThemeToggle();
  new LangToggle();

  // Back button handler (elements with .back-button)
  document.addEventListener('click', (e) => {
    const backBtn = e.target.closest && e.target.closest('.back-button');
    if (!backBtn) return;
    e.preventDefault();
    setTimeout(() => {
      if (history.length > 1) {
        history.back();
      } else {
        location.href = resolveSitePath('pages/passage.html');
      }
    }, 100);
  });
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }

  @keyframes animate-in {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  .animate-in {
    animation: animate-in 0.6s ease forwards;
  }

  .nav-open {
    overflow: hidden;
  }

  .nav-menu a.active,
  .nav-menu a.active:hover {
    background: var(--accent-green);
    color: var(--bg-primary);
    cursor: default;
  }

  .nav-menu a.active::before,
  .nav-menu a.active:hover::before {
    opacity: 0;
    left: -10px;
  }
`;
document.head.appendChild(style);
