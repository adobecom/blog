import predictUrl from '../tools/sidekick/predicturl/predicturl.js';

(async function init() {
  const sk = document.querySelector('aem-sidekick, helix-sidekick');
  sk.addEventListener('custom:predicted-url', predictUrl);
}());
