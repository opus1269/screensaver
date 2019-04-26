/**
 * Face detection in images
 *
 * @module scripts/ss/face_detect
 */

/** */

/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

declare var faceapi: any;

/**
 * Initialize the face api
 */
export async function initialize() {
  await faceapi.loadTinyFaceDetectorModel('/assets/models');
}

/**
 * Detect all the faces in an image
 *
 * @param img - image to check
 * @returns an array of detected faces
 */
export async function detectAll(img: HTMLImageElement) {
  return await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions());
}
