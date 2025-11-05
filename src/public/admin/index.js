/**
 * @author Harmeet Singh <harm2305@uw.edu>
 * @description This module contains functionality to support the admin panel
 * such as retrieving and updating options as well as retrieving logins
 */
import { qs, gen } from '/dom.js';
import { genBanner } from '/banners.js';

/**
 * Sets initial state of window after it has loaded
 */
window.addEventListener('load', async () => {
  await retrieveOptions();
  qs('#all-logins').addEventListener('click', getAllLogins);
  qs('#logins-date').addEventListener('submit', getLoginsByDate);
  qs('#logins-student').addEventListener('submit', getLoginsByStudent);
  qs('#option-form').addEventListener('submit', createOption);
});

/**
 * Retrieves all logins ordered by date & time descending and downloads it via a CSV
 * @param {Event} event The form event that triggered this function call
 */
async function getAllLogins(event) {
  event.preventDefault();

  const response = await fetch('/api/logins');

  if (response.ok) {
    const data = await response.json();
    const csv = recordsToCsv(data);
    downloadCsv(csv);
  } else {
    const responseText = await response.text();
    genBanner(responseText, qs('main'), 'error');

    setTimeout(() => {
      qs('main').removeChild(qs('main').firstChild);
    }, 4000);
  }
} 

/**
 * Pulls data from the database based on the date and downloads it via a CSV
 * @param {Event} event The form event that triggered this function call
 */
async function getLoginsByDate(event) {
  event.preventDefault();
  const formData = new FormData(event.target);

  const startDateLocal = new Date(formData.get('startDate'));
  const endDateLocal = new Date(formData.get('endDate'));

  const request = new URL('/api/logins', window.location.origin);
  request.searchParams.append('startDate', startDateLocal.toISOString());

  if (!isNaN(endDateLocal.valueOf())) {
    request.searchParams.append('endDate', endDateLocal.toISOString());
  }

  const response = await fetch(request);

  if (response.ok) {
    const data = await response.json();
    const csv = recordsToCsv(data);
    downloadCsv(csv);
  } else {
    const responseText = await response.text();
    genBanner(responseText, qs('main'), 'error');

    setTimeout(() => {
      qs('main').removeChild(qs('main').firstChild);
    }, 4000);
  }
}

/**
 * Pulls data from the database based on a student number and downloads it via a CSV
 * @param {Event} event The form event that triggered this function call
 */
async function getLoginsByStudent(event) {
  event.preventDefault();
  const formData = new FormData(event.target);

  const studentNumber = formData.get('studentNumber');
  const response = await fetch(`/api/logins/${studentNumber}`);

  if (response.ok) {
    const data = await response.json();
    const csv = recordsToCsv(data);
    downloadCsv(csv);
  } else {
    const responseText = await response.text();
    genBanner(responseText, qs('main'), 'error');

    setTimeout(() => {
      qs('main').removeChild(qs('main').firstChild);
    }, 4000);
  }
}

/**
 * Parses a set of records and puts them into CSV format perserving original ordering
 * @param {Array<Object>} records Converts a set of login records to a CSV string
 * @return {string} Records in CSV format
 */
function recordsToCsv(records) {
  let csv = 'Name,UwNetId,StudentId,Login Reason, Date, Time\n';

  records.forEach(record => {
    const studentInfo = record.student;
    const createdAt = new Date(record.createdAt);
    const loginReasons = record.loginReasons.join(';')

    csv += `${studentInfo.name},` +
      `${studentInfo.uwNetId ?? ''},` +
      `${studentInfo.number},` +
      `${loginReasons},` +
      `${createdAt.toLocaleDateString()},` +
      `${createdAt.toLocaleTimeString()}\n`;
  });

  return csv;
}

/**
 * Downloads a CSV file on the user's browser
 * @param {string} csv CSV to attach
 */
function downloadCsv(csv) {
  // Download CSV file
  let downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(csv));
  downloadAnchor.setAttribute('download', 'records.csv');
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);
}

/**
 * Retrieves a list of options and appends them to the DOM
 */
async function retrieveOptions() {
  const response = await fetch('/api/options');

  if (response.ok) {
    const options = await response.json();
    const parent = qs('#options-container');
    
    while (parent.firstChild) {
      parent.removeChild(parent.lastChild);
    }

    options.forEach(option => {
      const optionContainer = gen('div');
      const descriptionText = gen('p');
      const createdAtText = gen('p');
      const deleteButton = gen('button');
      deleteButton.addEventListener('click', event => { deleteOption(event, option.id);});
      deleteButton.innerText = 'Delete option';

      descriptionText.innerText = option.description;
      createdAtText.innerText = 'Created At: ' + new Date(option.createdAt).toLocaleString();

      optionContainer.appendChild(descriptionText);
      optionContainer.appendChild(createdAtText);
      optionContainer.appendChild(deleteButton);
      optionContainer.classList.add('option-item');

      parent.appendChild(optionContainer);
    });
  } else {
    const responseText = await response.text();
    genBanner(responseText, qs('main'), 'error');

    setTimeout(() => {
      qs('main').removeChild(qs('main').firstChild);
    }, 4000);
  }
}

/**
 * Adds the option to the database and updates the list of options
 * @param {string} optionDescription Description of the option to add
 */
async function createOption(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const optionDescription = formData.get('optionDescription');

  const response = await fetch('/api/options', {
    method: 'POST',
    body: JSON.stringify({description: optionDescription}),
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (response.ok) {
    await retrieveOptions();
  } else {
    const responseText = await response.text();
    genBanner(responseText, qs('main'), 'error');

    setTimeout(() => {
      qs('main').removeChild(qs('main').firstChild);
    }, 4000);
  }
}

/**
 * Deletes an option based on its ID and updates the list of options
 * @param {Event} event 
 * @param {string} optionId 
 */
async function deleteOption(event, optionId) {
  event.preventDefault();

  const response = await fetch(`/api/options/${optionId}`, {
    method: 'DELETE'
  });

  if (response.ok) {
    await retrieveOptions();
  } else {
    genBanner(response.statusText, qs('main'), 'error');

    setTimeout(() => {
      qs('main').removeChild(qs('main').firstChild);
    }, 4000);
  }
}
