const clubCompactArt = matchMedia('(max-width: 718px)');

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

(() => {
  const root = new URL('../', document.currentScript.src);
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
})();
