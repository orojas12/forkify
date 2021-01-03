/**
 * A module containing helper functions.
 * @module helpers
 */

import { TIMEOUT_SEC } from './config.js';

/**
 * Sends a GET or POST request to an API. If no data is passed, defaults to a GET request.
 * @param {string} url The URL to send the request to.
 * @param {object} [data=undefined] If passed, send the data in a POST request.
 * @returns {object} Parsed response data.
 */
export const AJAX = async function (url, data = undefined) {
  try {
    const request = data
      ? fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })
      : fetch(url);

    const response = await Promise.race([request, timeout(TIMEOUT_SEC)]);
    const responseData = await response.json();

    if (!response.ok)
      throw new Error(`${responseData.message} (${response.status})`);

    return responseData;
  } catch (err) {
    throw err;
  }
};

/**
 * Used as a timeout function inside a Promise.race(). Prevents an HTTP request from taking too
 * long to return a response.
 * @param {number} seconds The duration in seconds before rejecting a promise.
 * @returns A rejected promise.
 */
export const timeout = function (seconds) {
  return new Promise(function (_, reject) {
    setTimeout(function () {
      reject(
        new Error(`Request took too long! Timeout after ${seconds} seconds`)
      );
    }, seconds * 1000);
  });
};
