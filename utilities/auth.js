/**
 * @author Harmeet Singh <harm2305@uw.edu>
 * @description This module contains functions to validate user auth status
 */

/**
 * This function simply checks if the user session is authenticated and if 
 * they have an app role matching the one passed in.
 * 
 * @param {req} req User request that initiated this authentication challenge
 * @param {role} role The app role required to be matched
 * @returns {boolean} If a user is authenticated or not
 */
function isAuthenticated(req, role=null) {
  if (req.session.isAuthenticated !== true) {
    return false;
  }

  if (role === null) {
    return true;
  }

  return req.session.account.idTokenClaims.roles.includes(role);
}

module.exports = {
  isAuthenticated
};
