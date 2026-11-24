(() => {
  'use strict';

  const root = document.querySelector('[data-deck]');
  if (!root) return;
  const about = root.dataset.deck === 'about';
  const artURL = new URL('art/', document.currentScript.src);
  const archiveURL = new URL('../../archive/index.html', artURL);

  const homeCards = [
    { id: 'meetings', title: 'Живые\nвстречи', href: 'events/index.html', art: 'meetings',
      intro: 'В Клубе встречаются люди с разным опытом. Здесь можно познакомиться, поговорить о том, что волнует, и вместе найти неожиданные связи.' },
    { id: 'lectures', title: 'Лекции и\nсеминары', href: 'events/index.html', art: 'lectures',
      intro: 'На лекциях и семинарах разбираем сложные вопросы вместе. В плане есть лекция о конфигурации мышления и встреча об инструментах ИИ.' },
    { id: 'evenings', title: 'Тематические\nвечера', href: 'events/index.html', art: 'evenings',
      intro: 'Тематические вечера проходят в зале Клуба среди картин. Поводом для встречи может стать музыка или тема, которую хочется обсудить вместе.' },
    { id: 'archive', title: 'Архив\nлекций', href: 'archive/index.html', art: 'archive',
      intro: 'В архиве собраны прошедшие лекции, семинары и курсы. Здесь можно найти циклы о мировоззрении, теории культуры и русском искусстве.' },
    { id: 'about', title: 'О клубе', href: 'about/index.html', art: 'join',
      intro: 'Клуб объединяет живые встречи в Екатеринбурге и интернет-площадку с материалами. На странице о Клубе можно узнать, зачем мы собираемся и как участвовать.' }
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

  function watchDeckScroll(rail, items, select) {
    let settle;
    rail.addEventListener('scroll', () => {
      clearTimeout(settle);
      settle = setTimeout(() => {
        if (!rail.isConnected) return;
        const start = items[0].offsetLeft + rail.scrollLeft;
        const nearest = items.reduce((closest, item, index) =>
          Math.abs(item.offsetLeft - start) < Math.abs(items[closest].offsetLeft - start) ? index : closest, 0);
        select(nearest);
      }, 90);
    }, { passive: true });
  }

  function mountSpaceGallery(gallery, phone = false) {
    const rail = gallery.querySelector('.space-track');
    // The first photograph in the phone layout is the room with the white column.
    if (phone) rail.prepend(rail.querySelector('img[src$="space-02.webp"]').closest('.space-photo'));
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
    bindClubHover(rail, '.space-photo:not(.is-open)', photo => select(photos.indexOf(photo), false));
    bindDeckKeys(rail, photos, index => select(index, true));
    if (phone) watchDeckScroll(rail, photos, index => select(index, false));
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

  function makeIntro(text) {
    const intro = document.createElement('div');
    intro.className = 'deck-intro';
    text.split('\n\n').forEach(paragraph => {
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
    return intro;
  }

  function mountWideDeck(signal) {
    const cards = about ? aboutCards : homeCards;
    const track = document.createElement('div');
    track.className = 'club-deck';
    root.setAttribute('aria-label', about ? 'О клубе' : 'Разделы клуба');
    const detail = document.createElement('section');
    detail.className = 'deck-detail';
    detail.id = 'deck-detail';
    detail.hidden = true;
    const panels = [];
    let active = -1;

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
      clubDecoratePills(detail);
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
      const intro = makeIntro(card.intro);
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
      action.append(clubLineArtwork(card.href ? 'arrow-right' : 'arrow-down', 'deck-action-icon'));
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

    bindClubHover(track, '.deck-card:not(.is-open)', item => {
      if (!detail.querySelector(':focus-visible')) activate(panels.findIndex(({ panel }) => panel === item));
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
      window.addEventListener('hashchange', openHash, { signal });
      document.addEventListener('click', event => {
        const link = event.target.closest('a[href]');
        if (link && link.hash && link.pathname === location.pathname && link.hash === location.hash) openHash();
      }, { signal });
      openHash();
    } else {
      const previous = cards.findIndex(card => card.id === history.state?.clubCard);
      activate(previous < 0 ? 0 : previous, false, true);
    }
  }

  function mountPhoneDeck(signal) {
    const cards = about ? aboutCards : homeCards;
    const names = cards.map(card => card.title.replace('\n', ' '));
    const picker = document.createElement('div');
    picker.className = 'phone-deck-picker';
    picker.setAttribute('role', 'group');
    picker.setAttribute('aria-label', 'Разделы Клуба');
    const anchors = document.createElement('div');
    anchors.className = 'phone-deck-anchors';
    const track = document.createElement('div');
    track.className = 'club-deck phone-card-track';
    const detail = document.createElement('section');
    detail.className = 'deck-detail phone-deck-detail';
    detail.id = 'club-phone-detail';
    const panels = [];
    const buttons = [];
    let active = -1;
    const content = document.createElement('div');
    content.className = 'phone-deck-content';
    content.append(anchors, track, detail);
    root.append(picker, content);

    cards.forEach((card, index) => {
      const next = (index + 1) % cards.length;
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = '0' + (index + 1);
      button.setAttribute('aria-label', button.textContent + ' ' + names[index]);
      button.setAttribute('aria-controls', detail.id);
      button.append(clubOutline('circle'));
      picker.append(button);
      buttons.push(button);

      const panel = document.createElement('article');
      panel.className = 'deck-card phone-deck-card is-open';
      panel.dataset.card = card.id;
      // A fragment can scroll the page to the deck without moving the horizontal track.
      const anchor = document.createElement('span');
      anchor.id = card.id;
      anchors.append(anchor);
      const numeral = document.createElement('span');
      numeral.className = 'deck-number';
      numeral.textContent = '0.' + (index + 1);
      numeral.setAttribute('aria-hidden', 'true');
      const title = document.createElement('h2');
      title.className = 'deck-title';
      title.id = 'phone-deck-title-' + card.id;
      title.textContent = card.title;
      const caption = document.createElement('div');
      caption.className = 'phone-card-caption';
      caption.append(numeral, title);
      const action = document.createElement('button');
      action.type = 'button';
      action.className = 'deck-action';
      action.setAttribute('aria-controls', detail.id);
      action.setAttribute('aria-label', 'Следующий раздел «' + names[next] + '»');
      action.append(clubLineArtwork('arrow-right', 'deck-action-icon'));
      action.addEventListener('click', () => {
        if (active !== index) return;
        select(next, true);
        panels[next].querySelector('.deck-action').focus({ preventScroll: true });
      });
      const art = document.createElement('span');
      art.className = 'deck-artwork';
      const artName = card.art === 'idea' ? 'card-idea-mobile' : 'card-' + card.art;
      const illustration = image(artName, 'deck-art');
      art.append(illustration);
      const frame = clubOutline('path');
      frame.classList.add('deck-frame-joined');
      const fallback = clubOutline();
      fallback.classList.add('deck-frame-fallback');
      panel.append(fallback, frame, caption, art, action);
      track.append(panel);
      panels.push(panel);
      clubJoinFrame(frame, illustration, panel);
      button.addEventListener('click', () => select(index, true));
    });

    function fillDetail(card, name) {
      detail.dataset.section = card.id;
      detail.setAttribute('aria-labelledby', 'phone-deck-title-' + card.id);
      const introText = card.intro;
      if (card.href) {
        const intro = makeIntro(introText);
        const label = card.href.endsWith('events/index.html') ? 'План мероприятий' : name;
        if (!about) {
          const link = document.createElement('a');
          link.className = 'pill-action phone-home-card-link';
          link.href = card.href;
          const text = document.createElement('span');
          text.className = 'pill-label';
          const mark = document.createElement('span');
          mark.className = 'pill-mark';
          mark.setAttribute('aria-hidden', 'true');
          text.append(label, mark);
          link.append(text);
          detail.replaceChildren(intro, link);
          clubDecoratePills(detail);
          return;
        }
        const links = document.createElement('div');
        links.className = 'phone-detail-links';
        const destinations = [[label, card.href]];
        if (card.id === 'events') destinations.push(['Архив лекций', archiveURL]);
        for (const [title, url] of destinations) {
          const link = document.createElement('a');
          link.href = url;
          link.textContent = title;
          links.append(link);
        }
        detail.replaceChildren(intro, links);
        return;
      }
      const template = document.getElementById(card.id + '-detail');
      detail.replaceChildren(template ? template.content.cloneNode(true) : makeIntro(introText));
      clubDecoratePills(detail);
      if (card.id === 'join') detail.prepend(makeIntro(introText));
      const gallery = detail.querySelector('.club-space');
      if (gallery) mountSpaceGallery(gallery, true);
    }

    function select(index, move = false, preserveHash = false) {
      if (move) scrollCardIntoTrack(track, panels[0], panels[index]);
      if (active === index) return;
      active = index;
      const card = cards[index];
      buttons.forEach((button, i) => {
        button.setAttribute('aria-pressed', String(i === index));
        button.tabIndex = i === index ? 0 : -1;
        panels[i].inert = i !== index;
        panels[i].setAttribute('aria-hidden', String(i !== index));
      });
      const address = new URL(location.href);
      if (address.hash && !preserveHash) address.hash = card.id;
      history.replaceState({ ...history.state, clubPhoneSection: card.id }, '', address);
      if (about) document.dispatchEvent(new CustomEvent('club-deck-change', { detail: card.id }));
      fillDetail(card, names[index]);
    }

    function openPhoneHash() {
      const hash = location.hash.slice(1);
      const saved = history.state?.clubPhoneSection;
      const index = cards.findIndex(card => card.id === (hash || saved));
      select(Math.max(0, index), true, true);
      if (hash) document.getElementById(hash)?.scrollIntoView({ block: 'start', inline: 'nearest' });
    }

    bindDeckKeys(picker, buttons, index => {
      select(index, true);
      buttons[index].focus({ preventScroll: true });
    });
    watchDeckScroll(track, panels, index => select(index));
    window.addEventListener('hashchange', openPhoneHash, { signal });
    openPhoneHash();
  }

  let deckEvents;
  function mount() {
    deckEvents?.abort();
    root.querySelectorAll('.deck-frame-joined').forEach(frame => clubFrameObserver.unobserve(frame));
    root.replaceChildren();
    deckEvents = new AbortController();
    if (clubCompactArt.matches) mountPhoneDeck(deckEvents.signal);
    else mountWideDeck(deckEvents.signal);
  }
  clubCompactArt.addEventListener('change', mount);
  mount();
})();
