/**
 * A module containing project-wide configuration settings.
 * @module config
 */

/** URL used in API calls. */
export const API_URL = 'https://forkify-api.herokuapp.com/api/v2/recipes/';

/** The user key sent to API to store recipes created by the user. */
export const API_KEY = '83b9834c-581d-4def-bbf6-71093ec61026';

/** Number of seconds before HTTP requests will time out. */
export const TIMEOUT_SEC = 10;

/** Number of recipes to display per page in the results view. */
export const RESULTS_PER_PAGE = 10;

/** The duration in seconds before the add recipe modal closes after submission. */
export const MODAL_CLOSE_SEC = 2.5;
