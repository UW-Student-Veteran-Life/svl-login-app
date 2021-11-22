/**
 * Sets initial state of window after it has loaded
 */
window.addEventListener('load', () => {
  qs('form').addEventListener('submit', getCsv)
});

/**
 * Pulls data from the database based on the date passed via a form element and downloads via a CSV
 * @param {Event} e
 */
async function getCsv(e) {
  e.preventDefault();
  let date = new Date(e.target.elements['dateFilter'].value);
  let month = normalizeDateValue(date.getMonth()+1);
  let day = normalizeDateValue(date.getDate()+1);
  let year = normalizeDateValue(date.getFullYear());

  let request = new URL(window.location.origin + '/student/records');
  request.searchParams.append('date', `${month}-${day}-${year}`);
  const response = await fetch(request);
  let csv = await response.text();

  // Download CSV file
  let downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', "data:text/plain;charset=utf-8," + encodeURIComponent(csv));
  downloadAnchor.setAttribute('download', `${month}-${day}-${year}.csv`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);
}

/**
 * Prepends a 0 if value < 10
 * @param {Number} value
 * @returns Normalized value
 */
function normalizeDateValue(value) {
  if (value < 10) {
    return '0' + value;
  }

  return value;
}

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