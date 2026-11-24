const clubCompactArt = matchMedia('(max-width: 718px)');
const clubMouseHover = matchMedia('(hover: hover)');
const clubLineSprite = new URL('club-icons.svg?v=20261123-phone-review', document.currentScript.src);
const clubSvgNamespace = 'http://www.w3.org/2000/svg';

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
  const svg = document.createElementNS(clubSvgNamespace, 'svg');
  svg.classList.add('stroke-outline');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const mark = document.createElementNS(clubSvgNamespace, shape);
  if (shape === 'line') {
    mark.setAttribute('x2', '100%');
    mark.setAttribute('y1', '50%');
    mark.setAttribute('y2', '50%');
  } else if (shape === 'circle') {
    mark.setAttribute('cx', '50%');
    mark.setAttribute('cy', '50%');
    mark.setAttribute('r', '50%');
  } else {
    mark.setAttribute('width', '100%');
    mark.setAttribute('height', '100%');
  }
  svg.append(mark);
  return svg;
}

function clubSetLineArtwork(svg, file) {
  svg.firstElementChild.setAttribute('href', new URL('#' + file, clubLineSprite));
}

function clubLineArtwork(file, className) {
  const svg = document.createElementNS(clubSvgNamespace, 'svg');
  svg.classList.add('club-line-mark');
  if (className) svg.classList.add(className);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.append(document.createElementNS(clubSvgNamespace, 'use'));
  clubSetLineArtwork(svg, file);
  return svg;
}

function clubDecoratePills(root) {
  root.querySelectorAll('.pill-mark:empty').forEach(mark => mark.append(clubLineArtwork('pill-chevron')));
}

function clubIconLink(name, file, href) {
  const link = document.createElement('a');
  link.className = 'icon-link';
  link.href = href;
  link.title = name;
  link.setAttribute('aria-label', name);
  link.append(clubLineArtwork(file));
  return link;
}

function clubBackLink(root, page, referrer = document.referrer) {
  const fallback = document.body.dataset.event
    ? new URL(page + '/index.html#' + document.body.dataset.event, root)
    : new URL('index.html', root);
  const back = clubIconLink('Назад', 'nav-back', referrer || fallback);
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
  return back;
}

function clubPhoneNavigation(root, page) {
  const nav = document.createElement('nav');
  nav.className = 'phone-nav';
  nav.setAttribute('aria-label', 'Меню Клуба');
  const home = clubIconLink('Главная', 'nav-home', new URL('index.html', root));
  const cup = clubIconLink('О Клубе', 'cup', new URL('about/index.html', root));
  cup.firstElementChild.classList.add('club-cup');
  const plan = clubIconLink('План мероприятий', 'nav-plan', new URL('events/index.html', root));
  const join = clubIconLink('Варианты участия', 'nav-join', new URL('about/index.html#join', root));
  nav.append(home, clubBackLink(root, page, ''), cup, plan, join);

  function markSection(section = location.hash.slice(1)) {
    const current = page === 'events' || page === 'archive' ? plan
      : page === 'about' && section === 'join' ? join : cup;
    for (const [link, figure] of [[cup, 'cup'], [plan, 'nav-plan'], [join, 'nav-join']]) {
      const selected = link === current;
      if (selected) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
      clubSetLineArtwork(link.firstElementChild, selected ? figure + '-solid' : figure);
    }
  }
  markSection();
  window.addEventListener('hashchange', () => markSection());
  document.addEventListener('club-deck-change', event => markSection(event.detail));
  return nav;
}

function mountClubHeader(root, motion) {
  const matchArtworkToViewport = () => document.querySelectorAll('img[data-club-art]').forEach(clubArtwork);
  matchArtworkToViewport();
  clubDecoratePills(document);
  clubCompactArt.addEventListener('change', matchArtworkToViewport);
  const page = document.body.dataset.page;
  const phoneNav = clubPhoneNavigation(root, page);
  const header = document.querySelector('[data-inner-header]');
  if (!header) {
    document.querySelector('.home-page')?.prepend(phoneNav);
    return;
  }

  const pageNames = { about: 'о клубе', archive: 'архив лекций', events: 'план мероприятий' };
  const nav = document.createElement('nav');
  nav.className = 'inner-nav';
  nav.setAttribute('aria-label', 'Меню Клуба');
  nav.append(clubBackLink(root, page));
  for (const [name, icon, href] of [
    ['Главная', 'nav-home', new URL('index.html', root)],
    ['План мероприятий', 'nav-plan', new URL('events/index.html', root)],
    ['Адреса и контакты', 'nav-location', page === 'about' ? '#contacts' : new URL('about/index.html#contacts', root)],
    ['Присоединиться к клубу', 'nav-join', page === 'about' ? '#join' : new URL('about/index.html#join', root)]
  ]) {
    nav.append(clubIconLink(name, icon, href));
  }

  const articleTitle = document.querySelector('.event-article h1');
  const title = articleTitle || document.createElement('h1');
  title.className = 'nameplate';
  const current = document.createElement('strong');
  if (page === 'about') {
    current.textContent = 'клуб гардари';
    title.append('... ', current, ' ...');
  } else {
    if (articleTitle) current.append(...articleTitle.childNodes);
    else current.textContent = pageNames[page];
    const prefix = document.createElement('span');
    prefix.className = 'nameplate-prefix';
    prefix.textContent = 'клуб гардари  ...  ';
    title.replaceChildren(prefix, current);
  }
  title.append(clubOutline());
  const cup = clubLineArtwork('cup', 'club-cup');
  header.append(nav, phoneNav, title, cup);

  const compact = clubCompactArt.matches;
  playInnerEntrance(header, compact ? phoneNav : nav,
    compact && page === 'about' ? null : title, compact ? null : cup, motion);
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
    const titleDuration = title ? 190 : 0;
    const cupDuration = 160;
    links.forEach((link, index) => reveal(link, circle, index * stagger, iconDuration));

    const titleStart = (links.length - 1) * stagger + iconDuration;
    if (title) reveal(title, [
      { opacity: 0, clipPath: 'inset(-2px 100% -2px 0)' },
      { opacity: 1, clipPath: 'inset(-2px)' },
    ], titleStart, titleDuration);
    const cupStart = titleStart + titleDuration;
    if (cup) reveal(cup, circle, cupStart, cupDuration);

    const contentStart = cupStart + (cup ? cupDuration : 0);
    for (const block of page.children) {
      if (block === header) continue;
      reveal(block, [{ opacity: 0, translate: '0 6px' }, { opacity: 1, translate: '0 0' }], contentStart, 240);
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
