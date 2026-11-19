(() => {
  "use strict";

  const preview = new URLSearchParams(window.location.search).get("layout");
  const { userAgent, userAgentData, platform, maxTouchPoints } = navigator;
  const phone = /iPhone|iPod|Windows Phone|Android[^\n]*Mobile/i.test(userAgent);
  const tablet = /iPad|Android/i.test(userAgent) ||
    (/Macintosh|MacIntel/i.test(`${userAgent} ${platform}`) && maxTouchPoints > 1);
  const smallTablet = tablet && Math.min(screen.width, screen.height) < 768;
  const layout = phone || smallTablet || (!tablet && userAgentData?.mobile) ? "phone" : "desktop";

  document.documentElement.dataset.layout =
    preview === "phone" || preview === "desktop" ? preview : layout;
})();
