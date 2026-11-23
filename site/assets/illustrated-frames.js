const clubFrameDrawingCache = new Map();
const clubFramePainters = new WeakMap();
const clubFrameObserver = new ResizeObserver(entries => {
  for (const { target } of entries) clubFramePainters.get(target)?.();
});

function clubFrameSVG(name) {
  return document.createElementNS('http://www.w3.org/2000/svg', name);
}

function clubFrameDrawing(src) {
  const url = new URL(src);
  url.hash = '';
  if (!clubFrameDrawingCache.has(url.href)) {
    clubFrameDrawingCache.set(url.href, fetch(url).then(response => {
      if (!response.ok) throw new Error('Illustration unavailable');
      return response.text();
    }).then(markup => {
      const svg = new DOMParser().parseFromString(markup, 'image/svg+xml').documentElement;
      const [minX, , width] = svg.getAttribute('viewBox').split(' ').map(Number);
      const figure = svg.querySelector('g');
      const left = figure.querySelector('[data-frame-join="left"]');
      const right = figure.querySelector('[data-frame-join="right"]');
      const leftPath = left.getAttribute('d');
      const [, baseline] = leftPath.split(/[^\d.-]+/).filter(Boolean).slice(-2).map(Number);
      const [, rightTip, rightBaseline, rightTail] =
        /^M(-?[\d.]+) (-?[\d.]+)(.*)$/.exec(right.getAttribute('d'));
      if (baseline !== Number(rightBaseline)) throw new Error('Frame joins must share a baseline');
      left.remove();
      right.remove();
      return { minX, width, baseline, leftPath, rightTip: Number(rightTip), rightTail, figure };
    }));
  }
  return clubFrameDrawingCache.get(url.href);
}

function clubJoinFrame(svg, image, panel, variant) {
  clubFrameDrawing(image.src).then(drawing => {
    const outline = svg.querySelector('path');
    const figure = document.importNode(drawing.figure, true);
    figure.classList.add('joined-figure');
    figure.removeAttribute('stroke-width');
    figure.querySelectorAll('path, ellipse, circle').forEach(node => {
      node.setAttribute('vector-effect', 'non-scaling-stroke');
    });
    outline.setAttribute('vector-effect', 'non-scaling-stroke');
    outline.setAttribute('stroke-linejoin', 'round');
    outline.setAttribute('stroke-linecap', 'round');
    svg.append(figure);
    const px = value => Math.round(value * 1000) / 1000;

    function paint() {
      const bounds = svg.getBoundingClientRect();
      const art = image.getBoundingClientRect();
      if (!bounds.width || !bounds.height || !art.width) return;
      const width = px(bounds.width);
      const height = px(bounds.height);
      const radius = px(parseFloat(getComputedStyle(panel).borderTopLeftRadius));
      const scale = art.width / drawing.width;
      const offsetX = art.left - bounds.left - drawing.minX * scale;
      const offsetY = height - drawing.baseline * scale;
      const x = value => px(offsetX + value * scale);
      const points = path => path.replace(/(-?[\d.]+) (-?[\d.]+)/g,
        (_, a, b) => `${x(Number(a))} ${px(offsetY + Number(b) * scale)}`);
      const bottom = px(height - radius);
      const right = px(width - radius);
      const upperGaps = variant === 'desktop-hero'
        ? `H${px(width * 272 / 2902.365)} M${px(width * 1194 / 2902.365)} 0H${px(width * 1380 / 2902.365)} M${px(width * 2634 / 2902.365)} 0`
        : '';

      // The drawing's two leads continue directly into the panel outline.
      const path = `${points(drawing.leftPath)}H${radius}A${radius} ${radius} 0 0 1 0 ${bottom}` +
        `V${radius}A${radius} ${radius} 0 0 1 ${radius} 0${upperGaps}` +
        `H${right}A${radius} ${radius} 0 0 1 ${width} ${radius}` +
        `V${bottom}A${radius} ${radius} 0 0 1 ${right} ${height}` +
        `H${x(drawing.rightTip)}${points(drawing.rightTail)}`;
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      outline.setAttribute('d', path);
      figure.setAttribute('transform', `translate(${offsetX} ${offsetY}) scale(${scale})`);
      svg.classList.add('frame-joined');
      panel.classList.add('has-joined-frame');
    }

    clubFramePainters.set(svg, paint);
    clubFrameObserver.observe(svg);
    paint();
  }).catch(() => {
    // The original SVG and outline remain available if a drawing cannot load.
  });
}

(() => {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const image = hero.querySelector('.hero-scene');
  clubJoinFrame(hero.querySelector('.hero-outline--desktop'), image, hero, 'desktop-hero');
  clubJoinFrame(hero.querySelector('.hero-outline--mobile'), image, hero);
})();
