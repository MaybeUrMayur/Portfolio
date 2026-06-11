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
      });
      
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
      
      const NUM_CONFETTI = 350;
      const COLORS = [[255, 255, 255]];
      const PI_2 = 2 * Math.PI;
      
      let w = 0, h = 0;
      let xpos = 0.5;
      
      function resizeWindow() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
      }
      
      window.addEventListener('resize', resizeWindow, false);
      
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
        context.fillStyle = "#111";
        context.fillRect(0, 0, w, h);
        for (let c of confetti) {
          c.draw();
        }
      }
      
      document.onmousemove = function(e) {
        xpos = e.pageX / w;
      };
      
      window.addEventListener('load', function() {
        resizeWindow();
        step();
      });
      
      resizeWindow();
    })();

    // ------------------- VISITOR COUNT -------------------
    (function() {
      const visitorPill = document.getElementById("visitorPill");
      const visitorCountText = document.getElementById("visitorCountText");
      if (visitorPill && visitorCountText) {
        let count = parseInt(localStorage.getItem("portfolioVisits") || "0", 10);
        
        // Only increment if they are a new visitor
        if (!localStorage.getItem("portfolioHasVisited")) {
          count++;
          localStorage.setItem("portfolioVisits", count);
          localStorage.setItem("portfolioHasVisited", "true");
        }
        
        visitorCountText.textContent = count;
        visitorPill.setAttribute("data-tooltip", `visitor count ${count}`);
      }
    })();

    // ------------------- SCROLL ANIMATION EFFECT -------------------
    (function() {
      // 1. Set up the observer with 0.2 threshold
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          } else {
            // Optional: remove visible class if you want them to animate out when scrolling away
            entry.target.classList.remove('visible');
          }
        });
      }, { threshold: 0.1 });

      // 2. Select individual paragraphs, headings, and list items and observe them
      const items = document.querySelectorAll('.section-card p, .section-card h2, .section-card h3, .section-card li');
      items.forEach(item => {
        item.classList.add('animated-item');
        observer.observe(item);
      });
    })();
