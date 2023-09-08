import predictUrl from '../tools/sidekick/predicturl/predicturl.js';

(async function init() {
  const sk = document.querySelector('helix-sidekick');
  sk.addEventListener('custom:predicted-url', predictUrl);
}());
