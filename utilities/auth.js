/**
 * @author Harmeet Singh <harm2305@uw.edu>
 * @description This module contains functions to validate user auth status
 */

/**
 * Checks if the user is authenticated.
 * @param {req} req User request that initiated this authentication challenge
 * @returns {boolean} If a user is authenticated or not
 */
function isAuthenticated(req) {
  if (req.session === undefined) return false;

  if (req.session.isAuthenticated === undefined) return false;

  return req.session.isAuthenticated;
}

/**
 * Checks to ee if a user authorized based on a role name
 * @param {req} req User request that initiated this authentication challenge
 * @param {role} role  The app role required to be matched
 * @returns {boolean} If a user is authorized or not
 */
function isAuthorized(req, role) {
  if (req.session.isAuthenticated === undefined || req.session.isAuthenticated === false) return false;

  if (req.session.account.idTokenClaims.roles === undefined) return false;

  return req.session.account.idTokenClaims.roles.includes(role);
}

module.exports = {
  isAuthenticated,
  isAuthorized
};
