import { genBanner } from './banners.js';
import { gen, qs } from './dom.js';

/**
 * Set the initial state of the window by populating the login options
 */
window.addEventListener('load', async () => {
  let options = qs('#optionsContainer');
  qs('#studentIdentifier').focus();

  const response = await fetch('/api/options');

  if (response.ok) {
    const content = await response.json();
    if (content.length == 0) {
      genBanner('There are no login options present, please create them in the admin panel', qs('#submission-app'), 'error');
    } else {
      content.forEach(option => {
        const optionLabel = gen('label');
        optionLabel.innerHTML = `<input type="checkbox" name="loginReason" value="${option.description}"/> ${option.description}`; 
        options.appendChild(optionLabel);
      });
    }
  } else {
    genBanner('Unable to contact backend, please contact administrator', qs('#submission-app'), 'error');

    setTimeout(() => {
      qs('#submission-app').removeChild(qs('#submission-app').firstChild);
    }, 4000);
  }

  qs('#login-form').addEventListener('submit', submitLoginEvent);
});

/**
 * Submits a login event to the backend
 * @param {Event} event DOM event that triggered this function
 */
async function submitLoginEvent(event) {
  event.preventDefault();
  const data = new FormData(event.target);
  const identifierType = classifyIdentifer(data.get('studentIdentifier'));

  const body = {
    reasons: data.getAll('loginReason'),
    identifier: data.get('studentIdentifier'),
    identifierType: identifierType
  };

  // qs('#loginReason').selectedIndex = 0;
  qs('#studentIdentifier').value = '';
  qs('#studentIdentifier').focus();

  const response = await fetch('/api/logins', {
    method: 'POST',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  let messageTime = 2000;

  if (!response.ok) {
    const responseText = await response.text();
    genBanner(`There was an error logging in: ${responseText}`, qs('#submission-app'), 'error');
    messageTime = 4000;
  } else {
    genBanner(`${data.get('studentIdentifier')} has successfully logged in`, qs('#submission-app'));
  }

  setTimeout(() => {
    qs('#submission-app').removeChild(qs('#submission-app').firstChild);
  }, messageTime);
}

/**
 * Determines the type of identifer. Can be either magStripCode,
 * studentId, proxId, or uwNetId.
 * - magStripCode: code received from a mag strip on a card
 * - proxId: code received from an RFID scan
 * @param {string} identifier User identifier to classify
 * @returns {string} Classification of the identifier
 */
function classifyIdentifer(identifier) {
  const studentId = new RegExp('[0-9]{7}');

  if (identifier.length === 14) {
    return 'magStripCode';
  } else if (identifier.length === 16) {
    return 'proxRfid';
  } else if (studentId.test(identifier)) {
    return 'studentId';
  }

  return 'uwNetId';
}
