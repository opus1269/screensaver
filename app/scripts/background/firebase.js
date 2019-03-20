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
 * Initialize firebase and its Namespaces
 * @param {ServiceWorkerRegistration} swReg - use own ServiceWorker
 * @returns {Promise.<void>} void
 * @private
 */
function _initializeFirebase(swReg) {
  // noinspection SpellCheckingInspection
  const config = {
    apiKey: 'AIzaSyDOTQ6sUMq8XJg4_EoKG947h6GvcIKWlRI',
    authDomain: 'eminent-bond-863.firebaseapp.com',
    databaseURL: 'https://eminent-bond-863.firebaseio.com',
    storageBucket: 'eminent-bond-863.appspot.com',
    projectId: 'eminent-bond-863',
  };

  return _deleteFirebaseApp().then(() => {
    _app = firebase.initializeApp(config);

    _auth = firebase.auth();

    return Promise.resolve();
  });
}

/**
 * Delete firebase.app if it exists
 * @returns {Promise<void>|Promise<void>} void
 * @private
 */
function _deleteFirebaseApp() {
  if (_app) {
    return firebase.app().delete();
  }
  return Promise.resolve();
}

/**
 * Initialize the firebase libraries
 * @param {ServiceWorkerRegistration} swReg - service worker
 * @returns {Promise<void>} void
 */
export function initialize(swReg) {
  return _initializeFirebase(swReg);
}

/**
 * SignIn to firebase
 * @param {string} token - google auth token
 * @throws An error on signin failure
 * @returns {Promise<Object>} The current firebase user
 */
export function signIn(token) {
  const credential = firebase.auth.GoogleAuthProvider.credential(null, token);
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
