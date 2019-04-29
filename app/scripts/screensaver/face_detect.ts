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
 *
 * @throws An error if something goes wrong
 */
export function initialize() {
  // do not use await here. it does not catch errors properly
  return faceapi.loadTinyFaceDetectorModel('/assets/models').catch((err: any) => {
    throw err;
  });
}

/**
 * Detect all the faces in an image
 *
 * @param img - image to check
 * @returns an array of detected faces
 */
export function detectAll(img: HTMLImageElement) {
  // do not use await here. it does not catch errors properly
  return faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions()).then((detections: any) => {
    return detections;
  }).catch(() => {
    return [];
  });
}
