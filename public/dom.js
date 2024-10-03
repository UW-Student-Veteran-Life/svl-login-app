/**
 * @author Harmeet Singh <harm2305@uw.edu>
 * @description This module contains implementation to interact with DOM elements
 */

/**
 * Returns a new element with the given tag name.
 * @param {string} tagName - HTML tag name for new DOM element.
 * @returns {object} New DOM object for given HTML tag.
 */
export function gen(tagName) {
  return document.createElement(tagName);
}
  
/**
 * Returns the first element that matches the given CSS selector.
 * @param {string} selector - CSS query selector.
 * @returns {object} The first DOM object matching the query.
 */
export function qs(selector) {
  return document.querySelector(selector);
}
