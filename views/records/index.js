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
  const startDate = new Date(e.target.elements['startDate'].value);
  const endDate = new Date(e.target.elements['endDate'].value);
  endDate.setUTCHours(23, 59, 59, 999);

  let request = new URL(window.location.origin + '/student/records');
  request.searchParams.append('startDate', startDate.toISOString());
  request.searchParams.append('endDate', endDate.toISOString());
  const response = await fetch(request);
  const content = await response.json();

  if (response.ok) {
    let csv = "";

    content.forEach(record => {
      const date = new Date(record.timestamp);
      csv += `${record.name},` +
      `${record.netId},` +
      `${record.studentId},` +
      `${record.reason},` +
      `${date.getMonth()+1}/${date.getDate()}/${date.getFullYear()},` +
      `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}\n`;
    });

    // Download CSV file
    let downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', "data:text/plain;charset=utf-8," + encodeURIComponent(csv));
    downloadAnchor.setAttribute('download', `records.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  } else {
    alert (content);
  }
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