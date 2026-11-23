(() => {
  'use strict';

  const root = document.querySelector('[data-deck]');
  if (!root) return;
  const about = root.dataset.deck === 'about';
  const artURL = new URL('art/', document.currentScript.src);
  const homeIntro = 'Поэтому так важно «правильно\nразговаривать», поэтому так важно\nсмотреть в «нужные глаза».';

  const homeCards = [
    { id: 'meetings', title: 'Живые\nвстречи', href: 'events/index.html', art: 'meetings' },
    { id: 'lectures', title: 'Лекции и\nсеминары', href: 'events/index.html', art: 'lectures' },
    { id: 'evenings', title: 'Тематические\nвечера', href: 'events/index.html', art: 'evenings' },
    { id: 'archive', title: 'Архив\nлекций', href: 'archive/index.html', art: 'archive' },
    { id: 'about', title: 'О клубе', href: 'about/index.html', art: 'join' }
  ];
  const aboutCards = [
    { id: 'idea', title: 'Идея\nклуба', art: 'idea',
      intro: 'У Клуба два пространства. Первое — живые\nвстречи, лекции и разговоры, где можно\nпознакомиться, обсудить интересную тему,\nподелиться мыслями. Второе — интернет-\nплощадка с записями лекций,\nкурсами и другими\nматериалами.' },
    { id: 'join', title: 'Варианты\nучастия', rail: 'Присоединиться', art: 'join',
      intro: 'Вы можете просто посещать встречи\nклуба. В зависимости от ситуации\nони бывают платные и бесплатные.\n\nА можете присоединиться к нам\nи посещать все мероприятия\nв свободном режиме.' },
    { id: 'contacts', title: 'Адреса и\nконтакты', art: 'contacts',
      intro: 'Информация о том, где мы\nнаходимся и как с нами\nсвязаться.' },
    { id: 'events', title: 'План\nмероприятий', art: 'events', href: '../events/index.html',
      intro: 'Даты и информация о\nближайших встречах, лекциях\nи событиях клуба.' },
    { id: 'denis', title: 'Денис\nГардари', art: 'denis',
      intro: 'Об авторе и основателе\nпространства клуба.' }
  ];

  const cards = about ? aboutCards : homeCards;
  const track = document.createElement('div');
  track.className = 'club-deck';
  root.setAttribute('aria-label', about ? 'О клубе' : 'Разделы клуба');
  const detail = document.createElement('section');
  detail.className = 'deck-detail';
  detail.id = 'deck-detail';
  detail.hidden = true;
  const panels = [];
  const hover = matchMedia('(hover: hover)');
  let active = -1;

  function scrollCardIntoTrack(rail, first, current) {
    if (rail.scrollWidth > rail.clientWidth + 1) {
      rail.scrollTo({ left: current.offsetLeft - first.offsetLeft, behavior: 'instant' });
    }
  }

  function bindDeckKeys(rail, items, select) {
    rail.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const current = items.findIndex(item => item.contains(event.target));
      if (current < 0) return;
      const count = items.length;
      const targets = {
        ArrowLeft: (current + count - 1) % count, ArrowRight: (current + 1) % count,
        Home: 0, End: count - 1
      };
      if (!Object.hasOwn(targets, event.key)) return;
      event.preventDefault();
      select(targets[event.key]);
    });
  }

  function mountSpaceGallery(gallery) {
    const rail = gallery.querySelector('.space-track');
    const photos = [...rail.querySelectorAll('.space-photo')];
    rail.style.setProperty('--closed-cards', photos.length - 1);

    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.classList.add('space-tones');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const definitions = document.createElementNS(ns, 'defs');
    svg.append(definitions);
    gallery.prepend(svg);

    function select(index, focus) {
      photos.forEach((photo, i) => {
        const selected = i === index;
        photo.classList.toggle('is-open', selected);
        photo.setAttribute('aria-pressed', String(selected));
        photo.tabIndex = selected ? 0 : -1;
      });
      if (focus) {
        photos[index].focus({ preventScroll: true });
        scrollCardIntoTrack(rail, photos[0], photos[index]);
      }
    }

    photos.forEach((photo, index) => {
      const img = photo.querySelector('img');
      const curve = img.dataset.tone.split(' ').map(Number);
      const balance = img.dataset.balance.split(' ').map(Number);
      const filter = document.createElementNS(ns, 'filter');
      filter.id = 'club-space-tone-' + (index + 1);
      filter.setAttribute('color-interpolation-filters', 'sRGB');
      const transfer = document.createElementNS(ns, 'feComponentTransfer');
      ['R', 'G', 'B'].forEach((channel, i) => {
        const component = document.createElementNS(ns, 'feFunc' + channel);
        component.setAttribute('type', 'table');
        component.setAttribute('tableValues', curve.map(value => Math.min(1, value * balance[i]).toFixed(4)).join(' '));
        transfer.append(component);
      });
      const color = document.createElementNS(ns, 'feColorMatrix');
      color.setAttribute('type', 'saturate');
      color.setAttribute('values', img.dataset.saturation);
      filter.append(transfer, color);
      definitions.append(filter);
      img.style.filter = 'url(#' + filter.id + ')';
      img.draggable = false;
      photo.append(clubOutline());
      photo.addEventListener('click', () => select(index, true));
    });
    select(0, false);
    bindDeckKeys(rail, photos, index => select(index, true));
  }

  function closeDetails() {
    detail.hidden = true;
    panels.forEach(({ action }) => {
      if (action.hasAttribute('aria-controls')) action.setAttribute('aria-expanded', 'false');
    });
  }

  function showDetails(index) {
    const card = cards[index];
    const template = document.getElementById(card.id + '-detail');
    detail.replaceChildren(template.content.cloneNode(true));
    detail.hidden = false;
    detail.setAttribute('aria-labelledby', 'deck-title-' + card.id);
    panels[index].action.setAttribute('aria-expanded', 'true');
    const gallery = detail.querySelector('.club-space');
    if (gallery) mountSpaceGallery(gallery);
  }

  function activate(index, focusAction = false, scrollCard = false) {
    if (active !== index) {
      closeDetails();
      active = index;
      panels.forEach(({ panel, select, content }, i) => {
        const current = i === index;
        panel.classList.toggle('is-open', current);
        select.hidden = current;
        content.inert = !current;
        content.setAttribute('aria-hidden', String(!current));
      });
    }
    if (focusAction) panels[index].action.focus({ preventScroll: true });
    if (scrollCard) scrollCardIntoTrack(track, panels[0].panel, panels[index].panel);
  }

  function image(file, className) {
    const img = document.createElement('img');
    img.className = className;
    const url = new URL(file + '.svg', artURL);
    if (className === 'deck-art') url.searchParams.set('v', '20261123-frame-joins');
    img.src = url.href;
    img.alt = '';
    img.draggable = false;
    return clubArtwork(img);
  }

  cards.forEach((card, index) => {
    const name = card.title.replace('\n', ' ');
    const number = '0.' + (index + 1);
    const panel = document.createElement('article');
    panel.className = 'deck-card';
    panel.dataset.card = card.id;
    if (about) panel.id = card.id;
    const select = document.createElement('button');
    select.type = 'button';
    select.className = 'deck-select';
    select.setAttribute('aria-label', 'Раскрыть карточку «' + name + '»');
    const label = document.createElement('span');
    label.textContent = number + '  ' + (card.rail || name);
    select.append(label);

    const content = document.createElement('div');
    content.className = 'deck-content';
    const numeral = document.createElement('span');
    numeral.className = 'deck-number';
    numeral.textContent = number;
    const title = document.createElement('h2');
    title.id = 'deck-title-' + card.id;
    title.className = 'deck-title';
    title.textContent = card.title;
    const intro = document.createElement('div');
    intro.className = 'deck-intro';
    (card.intro || homeIntro).split('\n\n').forEach(paragraph => {
      const p = document.createElement('p');
      const lines = paragraph.split('\n');
      lines.forEach((line, i) => {
        p.append(line);
        if (i < lines.length - 1) {
          if (!line.endsWith('-')) p.append(' ');
          p.append(document.createElement('br'));
        }
      });
      intro.append(p);
    });
    const art = document.createElement('span');
    art.className = 'deck-artwork';
    const illustration = image('card-' + card.art, 'deck-art');
    art.append(illustration);

    const action = document.createElement(card.href ? 'a' : 'button');
    action.className = 'deck-action';
    if (card.href) {
      action.href = card.href;
      action.setAttribute('aria-label', 'Перейти в раздел «' + (card.href.includes('events') ? 'План мероприятий' : name) + '»');
      action.addEventListener('click', () => {
        history.replaceState({ ...history.state, clubCard: card.id }, '');
      });
    } else {
      action.type = 'button';
      action.setAttribute('aria-controls', detail.id);
      action.setAttribute('aria-expanded', 'false');
      action.setAttribute('aria-label', 'Описание раздела «' + name + '»');
      action.addEventListener('click', () => {
        if (detail.hidden) showDetails(index);
        else closeDetails();
      });
    }
    action.append(image(card.href ? 'arrow-right' : 'arrow-down', 'deck-action-icon'));
    content.append(numeral, title, intro, art, action);
    const fallback = clubOutline();
    fallback.classList.add('deck-frame-fallback');
    const frame = clubOutline('path');
    frame.classList.add('deck-frame-joined');
    panel.append(fallback, frame, select, content);
    track.append(panel);
    clubJoinFrame(frame, illustration, panel);
    panels.push({ panel, select, content, action });
    select.addEventListener('click', () => activate(index, true, true));
  });

  track.addEventListener('pointermove', event => {
    // A stationary pointer must not override keyboard selection during reflow.
    if (event.pointerType !== 'mouse' || !hover.matches || clubCompactArt.matches || !detail.hidden) return;
    const next = panels.findIndex(({ panel }) => panel.contains(event.target));
    if (next >= 0) activate(next);
  });

  bindDeckKeys(track, panels.map(({ panel }) => panel), index => activate(index, true, true));

  root.append(track);
  if (about) root.append(detail);

  if (about) {
    function openHash() {
      const index = cards.findIndex(card => '#' + card.id === location.hash);
      const target = index < 0 ? 0 : index;
      activate(target, false, true);
      if (!cards[target].href) showDetails(target);
    }
    window.addEventListener('hashchange', openHash);
    document.addEventListener('click', event => {
      const link = event.target.closest('a[href]');
      if (link && link.hash && link.pathname === location.pathname && link.hash === location.hash) openHash();
    });
    openHash();
  } else {
    const previous = cards.findIndex(card => card.id === history.state?.clubCard);
    activate(previous < 0 ? 0 : previous, false, true);
  }
})();
