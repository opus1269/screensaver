/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as ChromeStorage
  from '../../scripts/chrome-extension-utils/scripts/storage.js';
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

// noinspection SpellCheckingInspection
const config = {
  apiKey: 'AIzaSyDOTQ6sUMq8XJg4_EoKG947h6GvcIKWlRI',
  authDomain: 'eminent-bond-863.firebaseapp.com',
  databaseURL: 'https://eminent-bond-863.firebaseio.com',
  storageBucket: 'eminent-bond-863.appspot.com',
  projectId: 'eminent-bond-863',
};

/**
 * Get an auth token
 * @throws An error if we can't get the token
 * @returns {Promise<string>} auth token
 */
export async function getAuthToken() {
  const user = _auth.currentUser;
  if (user) {
    return await user.getIdToken();
  }
  throw new Error('No current user');
}

/**
 * SignIn to firebase
 * @throws An error on signin failure
 * @returns {Promise<Object>} The current firebase user
 */
export async function signIn() {
  
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/photoslibrary.readonly');
  provider.setCustomParameters({
    'prompt': 'select_account',
  });  
  
  // save token
  const result = await _auth.signInWithPopup(provider);
  const token = result.credential.accessToken;
  await ChromeStorage.asyncSet('token', token);
  
  const user = result.user;
  
  return Promise.resolve(user);
}

/**
 * Sign-out of firebase
 * @throws An error on sign-out failure
 * @returns {Promise<void>} Error on reject
 */
export function signOut() {
  return _auth.signOut();
}

/**
 * Event: called when document and resources are loaded
 * @private
 */
function _onLoad() {
  if (!_app) {
    _app = firebase.initializeApp(config);

    _auth = firebase.auth();
  }
}

// listen for document and resources loaded
window.addEventListener('load', _onLoad);


