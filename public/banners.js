/**
 * @author Harmeet Singh <harm2305@uw.edu>
 * @description This module contains code to generate and and append banners
 */
import { gen } from './dom.js';

/**
 * Generates a banner and appends it as the first sibling of the parent element
 * @param {string} bannerText Text of the banner
 * @param {Element} parent Element to append banner to
 * @param {string} type Banner type, either "success" or "error"
 * @return {Element} The generated DOM banner element
 */
export function genBanner(bannerText, parent, type='success') {
  const banner = gen('div');
  banner.classList.add('banner');
  banner.classList.add(`${type}-banner`);

  const bannerParagraph = gen('p');
  bannerParagraph.innerText = bannerText;
  banner.appendChild(bannerParagraph);

  parent.insertBefore(banner, parent.firstChild);

  return banner;
}
