    (function() {
      // ------------------- MAIN PILL -------------------
      const pillContainer = document.getElementById("mainPillNav");
      const slidingPill = document.getElementById("slidingPill");
      const navBtns = Array.from(document.querySelectorAll("#mainPillNav .interactive-pill"));
      let currentActiveBtn = null;
      let ignoreScrollUpdates = false;
      let scrollTimeout = null;

      function getRelativeRect(btn) {
        const containerRect = pillContainer.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        return { left: btnRect.left - containerRect.left, top: btnRect.top - containerRect.top, width: btnRect.width, height: btnRect.height };
      }

      function movePillTo(targetBtn, withTransition = true) {
        if (!targetBtn) return;
        const rect = getRelativeRect(targetBtn);
        if (!withTransition) slidingPill.style.transition = "none";
        slidingPill.style.width = rect.width + "px";
        slidingPill.style.height = rect.height + "px";
        slidingPill.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
        if (!withTransition) {
          void slidingPill.offsetHeight;
          slidingPill.style.transition = "transform 0.38s cubic-bezier(0.2, 0.85, 0.4, 1), width 0.38s cubic-bezier(0.2, 0.85, 0.4, 1)";
        }
        navBtns.forEach(btn => btn.classList.remove("active-text"));
        targetBtn.classList.add("active-text");
        currentActiveBtn = targetBtn;
      }

      if (navBtns.length) {
        currentActiveBtn = navBtns[0];
        movePillTo(navBtns[0], false);
      }

      function smoothScrollToSection(sectionId, btn) {
        const targetSection = document.getElementById(sectionId);
        if (!targetSection) return;
        ignoreScrollUpdates = true;
        if (scrollTimeout) clearTimeout(scrollTimeout);
        targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
        const finishScroll = () => {
          ignoreScrollUpdates = false;
          updateActivePillFromScroll();
          scrollTimeout = null;
        };
        if ('onscrollend' in window) {
          window.addEventListener('scrollend', () => { if (ignoreScrollUpdates) finishScroll(); }, { once: true });
        } else {
          scrollTimeout = setTimeout(finishScroll, 600);
        }
        if (currentActiveBtn !== btn) {
          movePillTo(btn, true);
          btn.focus({ preventScroll: true });
          btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }
      }

      navBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          const sectionId = btn.getAttribute("data-section");
          if (sectionId) smoothScrollToSection(sectionId, btn);
          else if (currentActiveBtn !== btn) {
            movePillTo(btn, true);
            btn.focus({ preventScroll: true });
            btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
          }
        });
      });

      let resizeTimer;
      window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { if (currentActiveBtn) movePillTo(currentActiveBtn, true); }, 100);
      });
      if (window.ResizeObserver) {
        new ResizeObserver(() => { if (currentActiveBtn) movePillTo(currentActiveBtn, true); }).observe(pillContainer);
      }

      // ------------------- SOCIAL TOGGLE (MOBILE) -------------------
      const socialToggleBtn = document.getElementById("socialToggleBtn");
      const socialPillNav = document.getElementById("socialPillNav");
      if (socialToggleBtn && socialPillNav) {
        socialToggleBtn.addEventListener("click", () => {
          socialPillNav.classList.toggle("expanded");
        });
      }


      // ------------------- SCROLL SYNC -------------------
      const profileSection = document.getElementById("profileSection");
      const sectionsData = [
        { id: "section-mayur", btnText: "Mayur Patil" },
        { id: "section-about", btnText: "About" },
        { id: "section-projects", btnText: "Projects" },
        { id: "section-connect", btnText: "Let's Connect" }
      ];

      function updateActivePillFromScroll() {
        if (ignoreScrollUpdates) return;
        let bestSection = null;
        let maxVisibility = 0;
        for (let sec of sectionsData) {
          const element = document.getElementById(sec.id);
          if (element) {
            const rect = element.getBoundingClientRect();
            const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
            const totalHeight = rect.height;
            const visibilityRatio = totalHeight > 0 ? Math.max(0, visibleHeight / totalHeight) : 0;
            if (visibilityRatio > maxVisibility) {
              maxVisibility = visibilityRatio;
              bestSection = sec;
            }
          }
        }
        if (bestSection && maxVisibility > 0.2) {
          const targetBtn = navBtns.find(btn => btn.getAttribute("data-section") === bestSection.id);
          if (targetBtn && currentActiveBtn !== targetBtn) {
            movePillTo(targetBtn, true);
            currentActiveBtn = targetBtn;
          }
        }
      }

      function handleProfileCompact() {
        const scrollAmount = window.scrollY;
        if (scrollAmount > 50) {
          if (!profileSection.classList.contains("compact")) profileSection.classList.add("compact");
        } else {
          if (profileSection.classList.contains("compact")) profileSection.classList.remove("compact");
        }
      }

      const observer = new IntersectionObserver((entries) => {
        if (ignoreScrollUpdates) return;
        let visibleSections = [];
        for (let entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.25) visibleSections.push(entry.target.id);
        }
        if (visibleSections.length) {
          const mostVisible = visibleSections[0];
          const matchedSection = sectionsData.find(s => s.id === mostVisible);
          if (matchedSection) {
            const matchedBtn = navBtns.find(btn => btn.getAttribute("data-section") === matchedSection.id);
            if (matchedBtn && currentActiveBtn !== matchedBtn) {
              movePillTo(matchedBtn, true);
              currentActiveBtn = matchedBtn;
            }
          }
        } else {
          updateActivePillFromScroll();
        }
      }, { threshold: 0.3, rootMargin: "-20% 0px -30% 0px" });

      sectionsData.forEach(sec => {
        const el = document.getElementById(sec.id);
        if (el) observer.observe(el);
      });

      window.addEventListener("scroll", () => {
        handleProfileCompact();
        if (!ignoreScrollUpdates) updateActivePillFromScroll();
      }, { passive: true });
      
      handleProfileCompact();
      updateActivePillFromScroll();

      window.addEventListener("load", () => {
        updateActivePillFromScroll();
        handleProfileCompact();
      });
      
      window.dispatchEvent(new Event('resize'));
    })();

    // ------------------- CONFETTI BACKGROUND -------------------
    (function() {
      const canvas = document.getElementById("world");
      if (!canvas) return;
      const context = canvas.getContext("2d");
      
      // Optimize particle count: 80% reduction for mobile (60 particles instead of 300)
      const NUM_CONFETTI = window.innerWidth < 768 ? 60 : 300;
      const COLORS = [[255, 255, 255]];
      const PI_2 = 2 * Math.PI;
      
      let w = 0, h = 0;
      let xpos = 0.5;
      
      function resizeWindow() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
      }
      
      window.addEventListener('resize', resizeWindow, { passive: true });
      
      function range(a, b) {
        return (b - a) * Math.random() + a;
      }
      
      function drawCircle(x, y, r, style) {
        context.beginPath();
        context.arc(x, y, r, 0, PI_2, false);
        context.fillStyle = style;
        context.fill();
      }
      
      class Confetti {
        constructor() {
          this.style = COLORS[~~range(0, COLORS.length)];
          this.rgb = `rgba(${this.style[0]},${this.style[1]},${this.style[2]}`;
          this.r = ~~range(1.5, 4);
          this.r2 = 2 * this.r;
          this.replace();
        }
        
        replace() {
          this.opacity = 0;
          this.dop = 0.005 * range(1, 4); /* Much slower fade for twinkling dust */
          this.x = range(-this.r2, w - this.r2);
          this.y = range(-20, h - this.r2);
          this.xmax = w - this.r;
          this.ymax = h - this.r;
          this.vx = range(-0.5, 0.5) + (xpos - 0.5) * 2; /* Gentle sway based on mouse */
          this.vy = 0.1 * this.r + range(0.1, 0.4); /* Very slow floating descent */
        }
        
        draw() {
          this.x += this.vx;
          this.y += this.vy;
          this.opacity += this.dop;
          if (this.opacity > 1) {
            this.opacity = 1;
            this.dop *= -1;
          }
          if (this.opacity < 0 || this.y > this.ymax) {
            this.replace();
          }
          if (!(0 < this.x && this.x < this.xmax)) {
            this.x = (this.x + this.xmax) % this.xmax;
          }
          drawCircle(~~this.x, ~~this.y, this.r, `${this.rgb},${this.opacity})`);
        }
      }
      
      let confetti = [];
      for (let i = 1; i <= NUM_CONFETTI; i++) {
        confetti.push(new Confetti());
      }
      
      function step() {
        requestAnimationFrame(step);
        if (window.innerWidth <= 1024) return;
        context.fillStyle = window.innerWidth <= 1024 ? "#000" : "#111";
        context.fillRect(0, 0, w, h);
        for (let c of confetti) {
          c.draw();
        }
      }
      
      document.addEventListener('mousemove', function(e) {
        xpos = e.pageX / w;
      }, { passive: true });
      
      window.addEventListener('load', function() {
        resizeWindow();
        step();
      });
      
      resizeWindow();
    })();


    // ------------------- SCROLL ANIMATION EFFECT -------------------
    (function() {
      // 1. Set up the observer with 0.2 threshold
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            entry.target.classList.remove('hidden-top');
          } else {
            entry.target.classList.remove('visible');
            // If the element is above the middle of the screen, it exited the top
            if (entry.boundingClientRect.top < window.innerHeight / 2) {
              entry.target.classList.add('hidden-top');
            } else {
              // Exited the bottom
              entry.target.classList.remove('hidden-top');
            }
          }
        });
      }, { threshold: 0.1 });

      // Helper to split text into words and wrap them with staggered delays
      function applyWordByWordEffect(container) {
        if (container.classList.contains('word-effect-applied')) return;
        container.classList.add('word-effect-applied');
        
        let wordIndex = 0;
        
        function processNode(node) {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.nodeValue;
            if (!text.trim()) return;
            
            const fragment = document.createDocumentFragment();
            const parts = text.split(/(\s+)/);
            parts.forEach(part => {
              if (!part) return;
              if (/^\s+$/.test(part)) {
                fragment.appendChild(document.createTextNode(part));
              } else {
                const span = document.createElement('span');
                span.className = 'blur-word';
                span.style.transitionDelay = `${Math.min(wordIndex * 25, 800)}ms`; // Cap delay to avoid excessive waits
                span.textContent = part;
                fragment.appendChild(span);
                wordIndex++;
              }
            });
            node.parentNode.replaceChild(fragment, node);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'SCRIPT' || node.classList.contains('blur-word') || node.tagName === 'I') return;
            Array.from(node.childNodes).forEach(processNode);
          }
        }
        
        Array.from(container.childNodes).forEach(processNode);
      }

      // 2. Select individual paragraphs, headings, and list items and observe them
      const items = document.querySelectorAll('.section-card p, .section-card h2, .section-card h3, .section-card li');
      items.forEach(item => {
        item.classList.add('animated-item');
        // Apply word-by-word splitting on all screen sizes
        applyWordByWordEffect(item);
        observer.observe(item);
      });
    })();

    // ------------------- CLICK SPARK EFFECT -------------------
    (function() {
      class ClickSparkEffect {
        constructor(options = {}) {
          this.sparkColor = options.sparkColor || '#ffffff';
          this.sparkSize = options.sparkSize ?? 10;
          this.sparkRadius = options.sparkRadius ?? 15;
          this.sparkCount = options.sparkCount ?? 8;
          this.duration = options.duration ?? 400;
          this.easing = options.easing || 'ease-out';
          this.extraScale = options.extraScale ?? 1.0;
          
          this.sparks = [];
          this.animationId = null;
          this.canvas = null;
          this.ctx = null;
          
          this.handleClick = this.handleClick.bind(this);
          this.drawLoop = this.drawLoop.bind(this);
          this.resizeCanvas = this.resizeCanvas.bind(this);
          
          this.initCanvas();
          window.addEventListener('resize', this.resizeCanvas);
          document.addEventListener('click', this.handleClick);
          this.startAnimation();
        }
        
        initCanvas() {
          this.canvas = document.createElement('canvas');
          this.canvas.style.position = 'fixed';
          this.canvas.style.top = '0px';
          this.canvas.style.left = '0px';
          this.canvas.style.width = '100vw';
          this.canvas.style.height = '100vh';
          this.canvas.style.pointerEvents = 'none';
          this.canvas.style.zIndex = '99999';
          document.body.appendChild(this.canvas);
          this.ctx = this.canvas.getContext('2d');
          this.resizeCanvas();
        }
        
        resizeCanvas() {
          this.canvas.width = window.innerWidth;
          this.canvas.height = window.innerHeight;
        }
        
        easeFunction(t) {
          switch (this.easing) {
            case 'linear': return t;
            case 'ease-in': return t * t;
            case 'ease-in-out': return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            default: return t * (2 - t);
          }
        }
        
        handleClick(e) {
          let x = e.clientX;
          let y = e.clientY;
          const now = performance.now();
          const angleStep = (2 * Math.PI) / this.sparkCount;
          
          for (let i = 0; i < this.sparkCount; i++) {
            this.sparks.push({
              x: x,
              y: y,
              angle: angleStep * i,
              startTime: now
            });
          }
          
          if (!this.animationId) {
            this.startAnimation();
          }
        }
        
        drawLoop(currentTime) {
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          const remainingSparks = [];
          
          for (let i = 0; i < this.sparks.length; i++) {
            const spark = this.sparks[i];
            const elapsed = currentTime - spark.startTime;
            
            if (elapsed >= this.duration) continue;
            
            remainingSparks.push(spark);
            const progress = elapsed / this.duration;
            const eased = this.easeFunction(progress);
            
            const distance = eased * this.sparkRadius * this.extraScale;
            const lineLength = this.sparkSize * (1 - eased);
            
            const startX = spark.x + distance * Math.cos(spark.angle);
            const startY = spark.y + distance * Math.sin(spark.angle);
            const endX = spark.x + (distance + lineLength) * Math.cos(spark.angle);
            const endY = spark.y + (distance + lineLength) * Math.sin(spark.angle);
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.strokeStyle = this.sparkColor;
            this.ctx.lineWidth = 2;
            this.ctx.lineCap = 'round';
            this.ctx.stroke();
          }
          
          this.sparks = remainingSparks;
          // Only continue the animation loop if there are sparks to render
          if (this.sparks.length > 0) {
            this.animationId = requestAnimationFrame(this.drawLoop);
          } else {
            this.animationId = null;
          }
        }
        
        startAnimation() {
          if (this.animationId) cancelAnimationFrame(this.animationId);
          this.animationId = requestAnimationFrame(this.drawLoop);
        }
      }

      // Initialize the spark effect globally
      new ClickSparkEffect({
        sparkColor: '#ffffff',
        sparkSize: 10,
        sparkRadius: 15,
        sparkCount: 8,
        duration: 400,
        easing: 'ease-out',
        extraScale: 1.0
      });
    })();

