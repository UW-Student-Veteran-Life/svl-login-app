/**
 * Set the initial state of the window
 */
window.addEventListener('load', async () => {
  let options = qs('select');

  const response = await fetch('/api/options');
  const content = await response.json();

  if (response.ok) {
    content.forEach(option => {
      const optionValue = gen('option');
      optionValue.text = option.description;
      optionValue.value = option.description;

      options.appendChild(optionValue)
    });
  }

  qs('form').addEventListener('submit', (e) => {
    e.preventDefault();
  });
});

/**
 * Returns a new element with the given tag name.
 * @param {string} tagName - HTML tag name for new DOM element.
 * @returns {object} New DOM object for given HTML tag.
 */
 function gen(tagName) {
  return document.createElement(tagName);
}

/**
 * Returns the first element that matches the given CSS selector.
 * @param {string} selector - CSS query selector.
 * @returns {object} The first DOM object matching the query.
 */
 function qs(selector) {
  return document.querySelector(selector);
}