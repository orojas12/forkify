import { TIMEOUT_SEC } from './config.js';

// export const getJSON = async function (url) {
//   try {
//     const request = fetch(url);
//     const response = await Promise.race([request, timeout(TIMEOUT_SEC)]);
//     const data = await response.json();

//     if (!response.ok) throw new Error(`${data.message} (${response.status})`);

//     return data;
//   } catch (err) {
//     throw err;
//   }
// };

// export const postJSON = async function (url, uploadData) {
//   try {
//     const request = uploadData
//       ? fetch(url, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify(uploadData),
//         })
//       : fetch(url);

//     const response = await Promise.race([request, timeout(TIMEOUT_SEC)]);
//     const data = await response.json();

//     if (!response.ok) throw new Error(`${data.message} (${response.status})`);

//     return data;
//   } catch (err) {
//     throw err;
//   }
// };

export const AJAX = async function (url, uploadData = undefined) {
  try {
    const request = uploadData
      ? fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(uploadData),
        })
      : fetch(url);

    const response = await Promise.race([request, timeout(TIMEOUT_SEC)]);
    const data = await response.json();

    if (!response.ok) throw new Error(`${data.message} (${response.status})`);

    return data;
  } catch (err) {
    throw err;
  }
};

export const timeout = function (s) {
  return new Promise(function (_, reject) {
    setTimeout(function () {
      reject(new Error(`Request took too long! Timeout after ${s} second`));
    }, s * 1000);
  });
};
