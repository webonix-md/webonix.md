/* ==========================================================================
   WEBONIX DESIGN SYSTEM — core.js
   Shared behavior: smooth scroll + reveal, custom cursor, live clock,
   RO/RU language switch, layer-nav scrollspy, terminal form submit.
   Load after Lenis + GSAP + ScrollTrigger CDN scripts. Call WEBONIX.initAll()
   once the DOM is ready, then wire any page-specific bits (selects, extra
   forms) with the small helpers exposed on window.WEBONIX.
   ========================================================================== */

window.WEBONIX = (function(){
  const onLangChange = [];
  let currentSection = 0;
  const FORM_ENDPOINT = 'https://webonix-form.igorok7312.workers.dev';

  function initScroll(){
    try{
      const lenis = new Lenis({ duration: 0.9, smoothWheel: true });
      function raf(time){ lenis.raf(time); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
      if(window.gsap && window.ScrollTrigger){
        gsap.registerPlugin(ScrollTrigger);
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time)=>{ lenis.raf(time*1000); });
        gsap.ticker.lagSmoothing(0);
      }
    }catch(e){}
  }

  function initScrollReveal(selector){
    selector = selector || '.section-head, .hero-title, .hero-sub, .cta-row, .cta, .media-grid, .cards, .terminal, .nav-cards, .advantages, .timeline, .stage-grid, .audit-grid, .fear-list, .faq-list, .package-grid, .guarantee-grid, .payment-steps, .text-photo-grid, .contact-items, .stats-row';
    if(!window.gsap || !window.ScrollTrigger) return;
    document.querySelectorAll('section').forEach(sec=>{
      gsap.from(sec.querySelectorAll(selector), {
        opacity:0, y:40, duration:0.9, stagger:0.08, ease:'power2.out',
        scrollTrigger:{ trigger: sec, start:'top 70%' }
      });
    });
  }

  function initVpReveal(){
    if(!window.gsap || !window.ScrollTrigger) return;
    document.querySelectorAll('#video-portfolio .vp-media').forEach(el=>{
      gsap.fromTo(el,
        { clipPath: 'inset(0 100% 0 0)' },
        { clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%' } }
      );
    });
  }

  function initVpPlayback(){
    const videos = document.querySelectorAll('#video-portfolio video');
    if(!videos.length || !window.IntersectionObserver) return;
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        const v = entry.target;
        if(entry.isIntersecting){ v.play().catch(()=>{}); }
        else { v.pause(); }
      });
    }, { threshold: 0.15 });
    videos.forEach(v=>io.observe(v));
  }

  function initCursor(){
    const cursor = document.getElementById('cursor');
    const coord = document.getElementById('cursorCoord');
    if(!cursor || !coord) return;
    window.addEventListener('mousemove', (e)=>{
      cursor.style.left = e.clientX+'px';
      cursor.style.top = e.clientY+'px';
      coord.style.left = e.clientX+'px';
      coord.style.top = e.clientY+'px';
      coord.textContent = `X:${e.clientX} Y:${e.clientY}`;
    });
    document.querySelectorAll('a,button,.card,input,select,textarea').forEach(el=>{
      el.addEventListener('mouseenter', ()=>cursor.classList.add('hover'));
      el.addEventListener('mouseleave', ()=>cursor.classList.remove('hover'));
    });
  }

  function initClock(){
    const el = document.getElementById('hud-clock');
    if(!el) return;
    function tick(){
      const d = new Date();
      const p = n=>String(n).padStart(2,'0');
      el.textContent = `LOCAL TIME: ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    }
    tick(); setInterval(tick, 1000);
  }

  function updateLayerLabel(){
    const lang = document.documentElement.getAttribute('data-lang');
    const label = document.getElementById('layerLabel');
    const sec = document.querySelector(`section[data-layer="${currentSection}"]`);
    if(label && sec) label.textContent = sec.dataset[lang === 'ru' ? 'labelRu' : 'labelRo'] || '';
  }

  function switchLang(lang){
    document.body.classList.add('glitching');
    document.querySelectorAll('.lang-switch button').forEach(b=>b.classList.toggle('active', b.dataset.lang===lang));
    setTimeout(()=>{
      document.documentElement.setAttribute('data-lang', lang);
      updateLayerLabel();
      onLangChange.forEach(fn=>fn(lang));
    }, 140);
    setTimeout(()=>{ document.body.classList.remove('glitching'); }, 450);
  }

  function initLangSwitch(){
    document.querySelectorAll('.lang-switch button[data-lang]').forEach(btn=>{
      btn.addEventListener('click', ()=>switchLang(btn.dataset.lang));
    });
  }

  function initNavToggle(){
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.site-links');
    if(!toggle || !links) return;
    toggle.addEventListener('click', ()=>{
      const willOpen = !links.classList.contains('open');
      links.classList.toggle('open');
      if(!willOpen){ document.querySelectorAll('.nav-dropdown.open').forEach(dd=>dd.classList.remove('open')); }
    });
    links.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=>links.classList.remove('open')));
  }

  function initNavDropdown(){
    const dropdowns = document.querySelectorAll('.nav-dropdown');
    if(!dropdowns.length) return;
    dropdowns.forEach(dd=>{
      const trigger = dd.querySelector('.nav-dropdown-trigger');
      if(!trigger) return;
      trigger.addEventListener('click', (e)=>{
        e.stopPropagation();
        const isOpen = dd.classList.contains('open');
        dropdowns.forEach(other=>other.classList.remove('open'));
        dd.classList.toggle('open', !isOpen);
      });
    });
    document.addEventListener('click', ()=>{
      dropdowns.forEach(dd=>dd.classList.remove('open'));
    });
    document.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape'){ dropdowns.forEach(dd=>dd.classList.remove('open')); }
    });
  }

  function initLayerNav(){
    const nav = document.getElementById('layerNav');
    const sections = document.querySelectorAll('section[data-layer]');
    if(!nav || !sections.length) return;
    const segsWrap = nav.querySelector('.segs');
    segsWrap.innerHTML = '';
    sections.forEach((s,i)=>{
      const seg = document.createElement('div');
      seg.className = 'seg' + (i===0 ? ' filled' : '');
      seg.dataset.i = i;
      segsWrap.appendChild(seg);
    });
    const segs = segsWrap.querySelectorAll('.seg');
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          currentSection = parseInt(entry.target.dataset.layer, 10);
          segs.forEach((s,i)=> s.classList.toggle('filled', i<=currentSection));
          updateLayerLabel();
        }
      });
    }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });
    sections.forEach(s=>io.observe(s));
    updateLayerLabel();
  }

  function initTypewriter(){
    const CHAR_DELAY = 28; // ms per character — fixed typing speed
    const lists = document.querySelectorAll('.spec-list');
    if(!lists.length || !window.IntersectionObserver) return;

    function buildScript(span){
      const script = [];
      (function walk(node, bold){
        node.childNodes.forEach(child=>{
          if(child.nodeType === Node.TEXT_NODE){
            for(const ch of child.textContent){ script.push({ ch, bold }); }
          } else if(child.tagName === 'B'){
            walk(child, true);
          } else {
            walk(child, bold);
          }
        });
      })(span, false);
      return script;
    }

    function typeSpan(span){
      const script = buildScript(span);
      span.textContent = '';
      const cursor = document.createElement('span');
      cursor.className = 'typewriter-cursor';
      cursor.textContent = '▌';
      span.appendChild(cursor);

      let i = 0;
      let boldEl = null;
      (function tick(){
        if(i >= script.length){ cursor.remove(); return; }
        const { ch, bold } = script[i];
        if(bold){
          if(!boldEl){ boldEl = document.createElement('b'); span.insertBefore(boldEl, cursor); }
          boldEl.appendChild(document.createTextNode(ch));
        } else {
          boldEl = null;
          span.insertBefore(document.createTextNode(ch), cursor);
        }
        i++;
        setTimeout(tick, CHAR_DELAY);
      })();
    }

    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting) return;
        io.unobserve(entry.target);
        const lang = document.documentElement.getAttribute('data-lang') || 'ru';
        const activeSpan = entry.target.querySelector(`:scope > span.${lang}`);
        if(activeSpan) typeSpan(activeSpan);
      });
    }, { threshold: 0.3 });
    lists.forEach(list=>io.observe(list));
  }

  function initCarousel3d(){
    const track = document.getElementById('carouselTrack');
    if(!track) return;

    const items = Array.from(track.querySelectorAll('.carousel3d-item'));
    const count = items.length;
    const angleStep = 360 / count;

    const tagEl = document.getElementById('carouselTag');
    const titleEl = document.getElementById('carouselTitle');
    const linkEl = document.getElementById('carouselLink');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');

    let currentAngle = 0;
    let radius = 360;
    let dragging = false;
    let dragStartX = 0;
    let dragStartAngle = 0;
    let autoplayTimer = null;

    function computeRadius(){
      const itemWidth = items[0].getBoundingClientRect().width || 230;
      radius = Math.round((itemWidth / 2) / Math.tan(Math.PI / count)) + 20;
    }

    function layout(){
      items.forEach((item, i)=>{
        item.style.transform = `rotateY(${i * angleStep}deg) translateZ(${radius}px)`;
      });
    }

    function normalize(angle){
      let a = angle % 360;
      if(a > 180) a -= 360;
      if(a < -180) a += 360;
      return a;
    }

    function updateActive(){
      let closestIndex = 0;
      let closestDiff = Infinity;
      items.forEach((item, i)=>{
        const effective = normalize(i * angleStep + currentAngle);
        const diff = Math.abs(effective);
        if(diff < closestDiff){ closestDiff = diff; closestIndex = i; }
        item.classList.toggle('is-active', diff < angleStep / 2);
      });
      const active = items[closestIndex];
      if(active && tagEl && titleEl && linkEl){
        const lang = document.documentElement.getAttribute('data-lang') || 'ru';
        tagEl.textContent = active.dataset['tag' + (lang === 'ro' ? 'Ro' : 'Ru')] || active.dataset.tag;
        titleEl.textContent = active.dataset.title;
        linkEl.href = active.dataset.href;
      }
    }

    function render(){
      track.style.transform = `rotateY(${currentAngle}deg)`;
      updateActive();
    }

    function rotateBy(deg){ currentAngle += deg; render(); }

    function startAutoplay(){
      stopAutoplay();
      autoplayTimer = setInterval(()=>{ if(!dragging) rotateBy(0.5); }, 30);
    }
    function stopAutoplay(){ if(autoplayTimer) clearInterval(autoplayTimer); }

    function onPointerDown(x){
      dragging = true; dragStartX = x; dragStartAngle = currentAngle;
      track.classList.add('is-dragging');
    }
    function onPointerMove(x){
      if(!dragging) return;
      const delta = x - dragStartX;
      currentAngle = dragStartAngle + delta * 0.35;
      render();
    }
    function onPointerUp(){ dragging = false; track.classList.remove('is-dragging'); }

    track.addEventListener('mousedown', (e)=>onPointerDown(e.clientX));
    window.addEventListener('mousemove', (e)=>onPointerMove(e.clientX));
    window.addEventListener('mouseup', onPointerUp);

    track.addEventListener('touchstart', (e)=>onPointerDown(e.touches[0].clientX), { passive: true });
    window.addEventListener('touchmove', (e)=>onPointerMove(e.touches[0].clientX), { passive: true });
    window.addEventListener('touchend', onPointerUp);

    if(prevBtn) prevBtn.addEventListener('click', ()=>rotateBy(-angleStep));
    if(nextBtn) nextBtn.addEventListener('click', ()=>rotateBy(angleStep));

    const stage = document.querySelector('.carousel3d-stage');
    if(stage){
      stage.addEventListener('mouseenter', stopAutoplay);
      stage.addEventListener('mouseleave', startAutoplay);
    }

    window.addEventListener('resize', ()=>{ computeRadius(); layout(); });
    onLangChange.push(updateActive);

    computeRadius();
    layout();
    render();
    startAutoplay();
  }

  function bindSelectOptions(selectId, optionsByLang){
    const sel = document.getElementById(selectId);
    if(!sel) return;
    function render(){
      const lang = document.documentElement.getAttribute('data-lang');
      const prevIndex = sel.selectedIndex > -1 ? sel.selectedIndex : 0;
      sel.innerHTML = (optionsByLang[lang] || []).map(t=>`<option>${t}</option>`).join('');
      sel.selectedIndex = prevIndex;
    }
    render();
    onLangChange.push(render);
  }

  function initTerminalForm(formId, statusId, messages){
    messages = messages || {
      ro: { sending: '> TRANSMITTING... ', done: '> STATUS: RECEIVED ✓', error: '> EROARE. Încercați din nou sau scrieți în Telegram.' },
      ru: { sending: '> ОТПРАВКА... ', done: '> СТАТУС: ПОЛУЧЕНО ✓', error: '> ОШИБКА. Попробуйте ещё раз или напишите в Telegram.' }
    };
    const form = document.getElementById(formId);
    const status = document.getElementById(statusId);
    if(!form || !status) return;
    form.addEventListener('submit', function(e){
      e.preventDefault();
      const lang = document.documentElement.getAttribute('data-lang');
      let bar = 0;
      const frames = ['█░░░░░░░░░','███░░░░░░░','█████░░░░░','███████░░░','██████████'];
      status.textContent = messages[lang].sending + frames[0];
      const iv = setInterval(()=>{
        bar++;
        if(bar < frames.length){ status.textContent = messages[lang].sending + frames[bar]; }
      }, 220);

      const data = new FormData(form);
      const payload = {
        name: data.get('name') || '',
        phone: data.get('phone') || '',
        url: data.get('url') || '',
        message: data.get('message') || '',
        messenger: data.get('messenger') || '',
        page: document.title
      };

      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(res=>{
        clearInterval(iv);
        if(res.ok){ status.textContent = messages[lang].done; form.reset(); }
        else { status.textContent = messages[lang].error; }
      }).catch(()=>{
        clearInterval(iv);
        status.textContent = messages[lang].error;
      });
    });
  }

  function initAll(){
    initScroll();
    initScrollReveal();
    initVpReveal();
    initVpPlayback();
    initCursor();
    initClock();
    initLangSwitch();
    initLayerNav();
    initNavToggle();
    initNavDropdown();
    initTypewriter();
    initCarousel3d();
  }

  return {
    initAll, initScroll, initScrollReveal, initVpReveal, initVpPlayback, initCursor, initClock,
    initLangSwitch, initLayerNav, initNavToggle, initNavDropdown, initTypewriter, initCarousel3d, switchLang, bindSelectOptions, initTerminalForm,
    onLangChange
  };
})();
