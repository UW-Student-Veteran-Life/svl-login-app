/**
 * @author Harmeet Singh <harm2305@uw.edu>
 * @description This module contains functions to validate user auth status
 */

/**
 * This function simply checks if the user session is authenticated.
 * While this function is pretty simple, it is left here a stub for future
 * developers if they would like to add additional features such as checking
 * for user roles and permissions
 * 
 * @param {req} req User request that initiated this authentication challenge
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
