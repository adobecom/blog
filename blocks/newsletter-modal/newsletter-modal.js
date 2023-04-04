import { getLibs } from '../../scripts/utils.js';

function displayConfirmation(content, message, createTag) {
  const confirmationText = createTag('p', { class: 'newsletter-modal-confirmation' }, message);
  const confirmationClose = createTag('button', { class: 'newsletter-modal-confirmation-close' }, 'Close');

  content.innerHTML = '';
  content.append(confirmationText, confirmationClose);

  confirmationClose.addEventListener('click', ({ target }) => {
    const modalClose = target.closest('.dialog-modal')?.querySelector('.dialog-close');
    modalClose?.click();
  });
}

function addClickEvent({
  emailEl, ctaEl, content, successMsg, errorMsg, consentNotice,
}, createTag) {
  ctaEl.addEventListener('click', (e) => {
    e.preventDefault();
    const email = emailEl.value;

    if (email && emailEl.checkValidity()) {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');

      const defaultConsentNotice = '<div class="disclaimer detail-spectrum-m" style="letter-spacing: 0px; padding-top: 15px;">The Adobe family of companies may keep me informed with personalized emails from the Adobe Blog team. See our <a href="https://www.adobe.com/privacy/policy.html" target="_blank">Privacy Policy</a> for more details or to opt-out at any time.</div>';
      const body = {
        sname: 'adbeblog',
        email,
        consent_notice: consentNotice || defaultConsentNotice,
        current_url: window.location.href,
      };

      const requestOptions = {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      };

      fetch('https://www.adobe.com/api2/subscribe_v1', requestOptions)
        .then(() => {
          displayConfirmation(content, successMsg, createTag);
        })
        .catch(() => {
          displayConfirmation(content, errorMsg, createTag);
        });
    } else {
      emailEl.classList.add('error');
      emailEl.reportValidity();
    }
  });
}

export default async function init(block) {
  const children = block.querySelectorAll(':scope > div');
  if (children.length < 4) return;

  const { createTag } = await import(`${getLibs()}/utils/utils.js`);

  children[0].classList.add('newsletter-modal-banner-container');

  const content = children[1];
  content.classList.add('newsletter-modal-content');
  content.firstElementChild.classList.add('newsletter-modal-text-container');
  content.firstElementChild.firstElementChild.classList.add('newsletter-modal-title');
  content.firstElementChild.lastElementChild.classList.add('newsletter-modal-disclaimer');

  const emailText = children[2].querySelector('div p:nth-child(1)').textContent;
  const emailPlaceholder = children[2].querySelector('div p:nth-child(2)').textContent;
  const cta = children[2].querySelector('div p:nth-child(3)').textContent;
  const form = createTag('form', { class: 'newsletter-modal-form' });
  const emailTextEl = createTag('span', { class: 'newsletter-modal-email-text', id: 'newsletter_email' }, emailText);
  const emailEl = createTag('input', { type: 'email', class: 'newsletter-modal-email', required: 'required' });
  const emailLabelEl = createTag('label', { class: 'newsletter-modal-email-label', for: 'newsletter_email' }, emailTextEl);
  emailLabelEl.append(emailEl);
  emailEl.placeholder = emailPlaceholder;
  const ctaEl = createTag('button', { type: 'submit', class: 'newsletter-modal-cta' }, cta);
  form.append(emailLabelEl, ctaEl);
  content.append(form);

  const successMsg = children[3].querySelector(':scope > div:nth-child(1) ').textContent;
  const errorMsg = children[3].querySelector(':scope > div:nth-child(2) ').textContent;
  const consentNotice = children[4]?.querySelector(':scope > div:nth-child(1) ')?.innerHTML;
  addClickEvent({
    emailEl, ctaEl, content, successMsg, errorMsg, consentNotice,
  }, createTag);
  children[4]?.remove();
  children[3].remove();
  children[2].remove();
}
