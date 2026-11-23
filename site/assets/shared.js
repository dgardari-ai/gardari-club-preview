const clubCompactArt = matchMedia('(max-width: 718px)');
const clubMouseHover = matchMedia('(hover: hover)');

function bindClubHover(rail, selector, activate) {
  // React to actual mouse movement, not to a stationary pointer during reflow.
  rail.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || event.buttons || !clubMouseHover.matches || clubCompactArt.matches) return;
    const item = event.target.closest(selector);
    if (!item || !rail.contains(item)) return;
    const focused = rail.querySelector(':focus-visible');
    if (!focused || item.contains(focused)) activate(item);
  });
}

function clubArtwork(image) {
  const source = new URL(image.src);
  source.hash = clubCompactArt.matches ? 'compact' : '';
  if (image.src !== source.href) image.src = source.href;
  image.dataset.clubArt = '';
  return image;
}

function clubOutline(shape = 'rect') {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.classList.add('stroke-outline');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const mark = document.createElementNS(ns, shape);
  if (shape === 'line') {
    mark.setAttribute('x2', '100%');
    mark.setAttribute('y1', '50%');
    mark.setAttribute('y2', '50%');
  } else {
    mark.setAttribute('width', '100%');
    mark.setAttribute('height', '100%');
  }
  svg.append(mark);
  return svg;
}

function mountClubHeader(root, motion) {
  const matchArtworkToViewport = () => document.querySelectorAll('img[data-club-art]').forEach(clubArtwork);
  matchArtworkToViewport();
  clubCompactArt.addEventListener('change', matchArtworkToViewport);
  const header = document.querySelector('[data-inner-header]');
  if (!header) return;

  const page = document.body.dataset.page;
  const pageNames = { about: 'о клубе', archive: 'архив лекций', events: 'план мероприятий' };
  const nav = document.createElement('nav');
  nav.className = 'inner-nav';
  nav.setAttribute('aria-label', 'Меню Клуба');

  function iconLink(name, file, href) {
    const link = document.createElement('a');
    link.className = 'icon-link';
    link.href = href;
    link.title = name;
    link.setAttribute('aria-label', name);
    const image = document.createElement('img');
    image.src = new URL('assets/art/' + file + '.svg', root);
    image.alt = '';
    link.append(clubArtwork(image));
    return link;
  }

  const fallback = document.body.dataset.event
    ? new URL(page + '/index.html#' + document.body.dataset.event, root)
    : new URL('index.html', root);
  const back = iconLink('Назад', 'nav-back', document.referrer || fallback);
  back.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const canGoBack = location.protocol === 'file:'
      ? history.length > 1
      : window.navigation?.canGoBack ?? history.length > 1;
    if (canGoBack) {
      event.preventDefault();
      history.back();
    }
  });
  nav.append(back);
  for (const [name, icon, href] of [
    ['Главная', 'nav-home', new URL('index.html', root)],
    ['План мероприятий', 'nav-plan', new URL('events/index.html', root)],
    ['Адреса и контакты', 'nav-location', page === 'about' ? '#contacts' : new URL('about/index.html#contacts', root)],
    ['Присоединиться к клубу', 'nav-join', page === 'about' ? '#join' : new URL('about/index.html#join', root)]
  ]) {
    nav.append(iconLink(name, icon, href));
  }

  const articleTitle = document.querySelector('.event-article h1');
  const title = articleTitle || document.createElement('h1');
  title.className = 'nameplate';
  const current = document.createElement('strong');
  if (page === 'about') {
    current.textContent = 'клуб гардари';
    title.append('... ', current, ' ...');
  } else {
    current.textContent = articleTitle?.textContent || pageNames[page];
    title.replaceChildren('клуб гардари  ...  ', current);
  }
  title.append(clubOutline());
  const cup = document.createElement('img');
  cup.src = new URL('assets/art/cup.svg', root);
  cup.alt = '';
  cup.className = 'club-cup';
  header.append(nav, title, clubArtwork(cup));

  playInnerEntrance(header, nav, title, cup, motion);
}

function playInnerEntrance(header, nav, title, cup, motion) {
  const root = document.documentElement;
  if (!root.classList.contains('inner-entrance-pending')) return;
  if (location.hash || motion.matches || document.hidden || window.scrollY > 1) {
    root.classList.remove('inner-entrance-pending');
    return;
  }

  const page = header.parentElement;
  const animations = [];
  const events = new AbortController();
  const { signal } = events;
  const easing = 'cubic-bezier(.16,1,.3,1)';
  const circle = [{ opacity: 0, scale: '.9' }, { opacity: 1, scale: '1' }];

  function finish() {
    if (signal.aborted) return;
    events.abort();
    root.classList.remove('inner-entrance-pending');
    for (const animation of animations) animation.cancel();
  }

  function reveal(node, frames, delay, duration) {
    animations.push(node.animate(frames, { delay, duration, easing, fill: 'both' }));
  }

  page.addEventListener('focusin', finish, { signal });
  page.addEventListener('pointerdown', finish, { capture: true, signal });
  window.addEventListener('pagehide', finish, { signal });
  window.addEventListener('hashchange', finish, { signal });
  window.addEventListener('scroll', () => { if (window.scrollY > 1) finish(); }, { passive: true, signal });
  document.addEventListener('visibilitychange', () => { if (document.hidden) finish(); }, { signal });
  motion.addEventListener('change', () => { if (motion.matches) finish(); }, { signal });

  try {
    const links = [...nav.children];
    const stagger = 65;
    const iconDuration = 170;
    const titleDuration = 190;
    const cupDuration = 160;
    links.forEach((link, index) => reveal(link, circle, index * stagger, iconDuration));

    const titleStart = (links.length - 1) * stagger + iconDuration;
    reveal(title, [
      { opacity: 0, clipPath: 'inset(-2px 100% -2px 0)' },
      { opacity: 1, clipPath: 'inset(-2px)' },
    ], titleStart, titleDuration);
    const cupStart = titleStart + titleDuration;
    reveal(cup, circle, cupStart, cupDuration);

    for (const block of page.children) {
      if (block === header) continue;
      reveal(block, [{ opacity: 0, translate: '0 6px' }, { opacity: 1, translate: '0 0' }], cupStart + cupDuration, 240);
    }
    const start = document.timeline.currentTime;
    for (const animation of animations) animation.startTime = start;
    root.classList.remove('inner-entrance-pending');
    Promise.all(animations.map(animation => animation.finished)).then(finish, finish);
  } catch {
    finish();
  }
}

(() => {
  const script = document.currentScript;
  const root = new URL('../', script.src);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const navigation = performance.getEntriesByType('navigation')[0];
  if (script.hasAttribute('data-inner-entrance') && !location.hash && !motion.matches && !document.hidden &&
      navigation?.type !== 'back_forward' && Element.prototype.animate) {
    const html = document.documentElement;
    html.classList.add('inner-entrance-pending');
    setTimeout(() => html.classList.remove('inner-entrance-pending'), 1500);
  }

  const mount = () => mountClubHeader(root, motion);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
