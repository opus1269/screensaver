/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Manage interaction with firebase and its Namespaces
 * @see https://firebase.google.com/docs/web/setup
 * @module Fb
 */

/**
 * Firebase app
 * @private
 */
let _app = null;

/**
 * Firebase auth namespace
 * @private
 */
let _auth;

/**
 * Initialize the firebase libraries
 */
export function initialize() {
  // noinspection SpellCheckingInspection
  const config = {
    apiKey: 'AIzaSyDOTQ6sUMq8XJg4_EoKG947h6GvcIKWlRI',
    authDomain: 'eminent-bond-863.firebaseapp.com',
    databaseURL: 'https://eminent-bond-863.firebaseio.com',
    storageBucket: 'eminent-bond-863.appspot.com',
    projectId: 'eminent-bond-863',
  };

  if (!_app) {
    _app = window.firebase.initializeApp(config);

    _auth = window.firebase.auth();
  }
}

/**
 * SignIn to firebase
 * @param {string} token - google auth token
 * @throws An error on signin failure
 * @returns {Promise<Object>} The current firebase user
 */
export function signIn(token) {
  const credential =
      window.firebase.auth.GoogleAuthProvider.credential(null, token);
  return _auth.signInAndRetrieveDataWithCredential(credential).
      then((result) => {
        return Promise.resolve(result.user);
      });
}

/**
 * Sign-out of firebase
 * @throws An error on sign-out failure
 * @returns {Promise<void>} Error on reject
 */
export function signOut() {
  return _auth.signOut();
}

