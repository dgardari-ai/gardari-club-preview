(() => {
  const root = document.documentElement;
  if (!root.classList.contains('home-entrance-pending')) return;

  const main = document.querySelector('.home-page');
  const hero = main.querySelector('.hero');
  const scene = hero.querySelector('.hero-scene');
  const deck = main.querySelector('[data-deck="home"]');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = clubCompactArt;
  const events = new AbortController();
  const { signal } = events;
  const heroAnimations = [];
  const deckAnimations = [];
  const tracedStrokes = [];
  const revealEase = 'cubic-bezier(.16,1,.3,1)';
  const svgNS = 'http://www.w3.org/2000/svg';
  let removeFrameMask = () => {};
  let startupTimer;

  function svgElement(tag, attributes) {
    const node = document.createElementNS(svgNS, tag);
    for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
    return node;
  }

  function animate(node, frames, options) {
    const animation = node.animate(frames, { fill: 'both', ...options });
    heroAnimations.push(animation);
    return animation;
  }

  function releaseHero() {
    for (const animation of heroAnimations.splice(0)) animation.cancel();
    for (const path of tracedStrokes.splice(0)) path.removeAttribute('pathLength');
    removeFrameMask();
    removeFrameMask = () => {};
  }

  function finish() {
    if (signal.aborted) return;
    events.abort();
    clearTimeout(startupTimer);
    releaseHero();
    for (const animation of deckAnimations) animation.cancel();
    deck.classList.remove('home-deck-pending');
    root.classList.remove('home-entrance-pending');
  }

  function traceDrawing({ figure, drawing }) {
    const center = drawing.minX + drawing.width / 2;
    const baseline = drawing.minY + drawing.height * .97;
    const distance = point => Math.hypot((point.x - center) * .85, point.y - baseline);
    const strokes = [...figure.querySelectorAll('path')].map(path => {
      const length = path.getTotalLength();
      const from = distance(path.getPointAtLength(0));
      const to = distance(path.getPointAtLength(length));
      return { path, length, distance: Math.min(from, to), direction: from <= to ? 1 : -1 };
    });
    if (!strokes.length) throw new Error('The hero SVG has no contours');

    // Start the strokes closest to the figures' feet, then spread out and up.
    const near = Math.min(...strokes.map(stroke => stroke.distance));
    const span = Math.max(...strokes.map(stroke => stroke.distance)) - near || 1;
    const drawingDeadline = 1320;
    let end = 0;
    for (const { path, length, distance: offset, direction } of strokes) {
      const delay = (offset - near) / span * 1060;
      const duration = Math.min(520, 170 + length * .58, drawingDeadline - delay);
      path.setAttribute('pathLength', '1');
      tracedStrokes.push(path);
      animate(path, [
        { opacity: 0, strokeDasharray: '1 1', strokeDashoffset: String(direction) },
        { opacity: 1, offset: .06 },
        { opacity: 1, strokeDasharray: '1 1', strokeDashoffset: '0' },
      ], { delay, duration, easing: 'cubic-bezier(.32,.18,.55,1)' });
      end = Math.max(end, delay + duration);
    }
    return end;
  }

  function traceFrame(joinAt, outline, { width, height, radius, left, right }) {
    const svg = outline.ownerSVGElement;
    const pad = 12;
    const maskId = 'club-entrance-frame';
    const defs = svgElement('defs', {});
    const mask = svgElement('mask', {
      id: maskId, maskUnits: 'userSpaceOnUse',
      x: -pad, y: -pad, width: width + 2 * pad, height: height + 2 * pad,
    });
    defs.append(mask);
    svg.append(defs);
    outline.setAttribute('mask', `url(#${maskId})`);
    removeFrameMask = () => { outline.removeAttribute('mask'); defs.remove(); };

    const speed = .88;
    const ms = distance => distance / speed;

    function travel({ lead, route }, direction) {
      const leadLength = svgElement('path', { d: lead }).getTotalLength();
      const path = svgElement('path', { d: route, fill: 'none', stroke: 'white', 'stroke-width': 7, 'stroke-linecap': 'round' });
      mask.append(path);
      const length = path.getTotalLength();
      path.setAttribute('stroke-dasharray', `${length} ${length}`);
      // The same dash crosses the drawn lead and the frame at a constant speed.
      const delay = joinAt - ms(leadLength);
      const duration = ms(length);
      animate(path, [
        { opacity: 0, strokeDashoffset: String(direction * length) },
        { opacity: 1, offset: .001 },
        { opacity: 1, strokeDashoffset: '0' },
      ], { delay, duration });
      return delay + duration;
    }

    const end = Math.max(travel(left, 1), travel(right, -1));
    const top = svg.getBoundingClientRect().top;
    const pageLeft = svg.getBoundingClientRect().left;
    const arc = Math.PI * radius / 2;
    const vertical = height - 2 * radius;
    const leftSide = left.join - radius + arc;
    const rightSide = width - radius - right.join + arc;
    const upTo = y => Math.min(vertical, Math.max(0, height - radius - (y - top)));
    return {
      end,
      leftAt: y => joinAt + ms(leftSide + upTo(y)),
      rightAt: y => joinAt + ms(rightSide + upTo(y)),
      topFromLeft: x => joinAt + ms(leftSide + vertical + arc + Math.max(0, x - pageLeft - radius)),
      topFromRight: x => joinAt + ms(rightSide + vertical + arc + Math.max(0, width - radius - (x - pageLeft))),
    };
  }

  function revealHero(frame) {
    const wipe = (node, delay, duration, initialOpacity = 0) => {
      animate(node, [
        { opacity: initialOpacity, clipPath: 'inset(-2px 0 -2px 100%)' },
        { opacity: 1, clipPath: 'inset(-2px)' },
      ], { delay, duration, easing: revealEase });
      return delay + duration;
    };

    let end = frame.end;
    for (const paragraph of hero.querySelectorAll('.hero-copy p')) {
      end = Math.max(end, wipe(paragraph, frame.rightAt(paragraph.getBoundingClientRect().bottom), 320));
    }
    const join = hero.querySelector('.join-action');
    // Clip the label, keeping the hit area of the actual link available.
    const joinStart = frame.rightAt(join.getBoundingClientRect().bottom);
    animate(join, [{ opacity: 0 }, { opacity: 1 }], { delay: joinStart, duration: 250, easing: revealEase });
    end = Math.max(end, wipe(join.firstElementChild, joinStart, 250));

    const title = hero.querySelector('.nameplate');
    end = Math.max(end, wipe(title, frame.topFromRight(title.getBoundingClientRect().right), 370, 1));
    const nav = compact.matches ? main.querySelector('.phone-nav') : hero.querySelector('.hero-nav');
    let previous = -Infinity;
    for (const icon of nav.querySelectorAll('.club-line-mark:not(.club-cup)')) {
      const box = icon.getBoundingClientRect();
      const arrival = compact.matches ? frame.leftAt(box.bottom) : frame.topFromLeft(box.left + box.width / 2);
      const delay = Math.max(arrival, previous + 72);
      animate(icon, [{ opacity: 0, translate: '0 4px' }, { opacity: 1, translate: '0 0' }],
        { delay, duration: 220, easing: revealEase });
      end = Math.max(end, delay + 220);
      previous = delay;
    }

    const beforeCup = Promise.all(heroAnimations.map(animation => animation.finished));
    const cup = (compact.matches ? nav : hero).querySelector('.club-cup');
    animate(cup, [{ opacity: 0 }, { opacity: 1 }], { delay: end, duration: 180, easing: revealEase });
    const pulse = animate(cup, [
      { scale: '1', easing: 'ease-in-out' },
      { scale: '1.09', easing: 'ease-in-out' },
      { scale: '1' },
    ], { delay: end + 180, duration: 380, iterations: 3, fill: 'none' });
    return { beforeCup, pulse };
  }

  function waitForDeck() {
    if (typeof IntersectionObserver === 'undefined') return Promise.resolve();
    return new Promise(resolve => {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) stop();
      }, { rootMargin: '0px 0px -24px 0px' });
      function stop() { observer.disconnect(); resolve(); }
      signal.addEventListener('abort', stop, { once: true });
      observer.observe(deck);
    });
  }

  async function revealDeck() {
    if (signal.aborted) return;
    await waitForDeck();
    if (signal.aborted) return;

    const parts = compact.matches ? '.phone-deck-picker, .phone-card-track' : '.deck-card';
    deck.querySelectorAll(parts).forEach((card, index) => {
      deckAnimations.push(card.animate([
        { opacity: 0, translate: '0 12px' },
        { opacity: 1, translate: '0 0' },
      ], { duration: 460, delay: index * 65, easing: revealEase, fill: 'both' }));
    });
    deck.classList.remove('home-deck-pending');
    await Promise.all(deckAnimations.map(animation => animation.finished));
  }

  const windowWidth = window.innerWidth;
  window.addEventListener('resize', () => { if (window.innerWidth !== windowWidth) finish(); }, { signal });
  window.addEventListener('pagehide', finish, { signal });
  window.addEventListener('hashchange', finish, { signal });
  window.addEventListener('scroll', () => {
    if (compact.matches && window.scrollY > 1) finish();
  }, { passive: true, signal });
  document.addEventListener('visibilitychange', () => { if (document.hidden) finish(); }, { signal });
  motion.addEventListener('change', () => { if (motion.matches) finish(); }, { signal });
  main.addEventListener('focusin', finish, { signal });
  main.addEventListener('pointerdown', event => {
    if (event.target.closest('a,button')) finish();
  }, { capture: true, signal });

  (async () => {
    startupTimer = setTimeout(finish, 2000);
    try {
      if (motion.matches || window.scrollY > 1) return;
      const [joined] = await Promise.all([
        clubHeroFrames[compact.matches ? 'mobile' : 'desktop'],
        scene.decode(),
        document.fonts.ready,
      ]);
      if (!joined || signal.aborted || !root.classList.contains('home-entrance-pending')) return;

      const geometry = joined.paint();
      if (!geometry) return;
      const drawingEnd = traceDrawing(joined);
      const frame = traceFrame(drawingEnd / 2, joined.outline, geometry);
      const { beforeCup, pulse } = revealHero(frame);
      const start = document.timeline.currentTime;
      for (const animation of heroAnimations) animation.startTime = start;
      deck.classList.add('home-deck-pending');
      root.classList.remove('home-entrance-pending');
      clearTimeout(startupTimer);

      await Promise.all([
        beforeCup.then(revealDeck),
        pulse.finished.then(releaseHero),
      ]);
    } catch {
      // The normal page remains usable after interrupted motion or a failed asset.
    } finally {
      finish();
    }
  })();
})();
