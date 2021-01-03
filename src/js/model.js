/**
 * A module containing the application state, networking, and business logic
 * belonging to the model.
 * @module model
 */

import { API_URL, API_KEY, RESULTS_PER_PAGE } from './config.js';
import { AJAX } from './helpers.js';

/**
 * Application state
 * @namespace
 * @property {object} recipe - The current recipe displayed.
 * @property {object} search - Contains recipe search data.
 * @property {string} search.query - Used in searching the API for recipes.
 * @property {object[]} search.results - All recipes matching the search query
 * @property {number} search.resultsPerPage - How many recipes to display in each page
 * of the results view.
 * @property {number} search.page - The current page in the results view.
 * @property {object[]} bookmarks - All recipes marked as bookmarks by the user.
 */
export const state = {
  recipe: {},
  search: {
    query: '',
    results: [],
    resultsPerPage: RESULTS_PER_PAGE,
    page: 1,
  },
  bookmarks: [],
};

/**
 * Formats the recipe object returned from the API in a way that
 * the application can understand.
 * @param {object} recipe A recipe parsed from JSON.
 * @returns {object} A formatted clone of the recipe.
 */
const createRecipeObject = function (recipe) {
  return {
    id: recipe.id,
    title: recipe.title,
    publisher: recipe.publisher,
    sourceUrl: recipe.source_url,
    image: recipe.image_url,
    cookingTime: +recipe.cooking_time,
    servings: +recipe.servings,
    ingredients: recipe.ingredients,
    ...(recipe.key && { key: recipe.key }), // Adds user API key if user-generated recipe.
  };
};

/**
 * Gets a recipe from the API and inserts it into the state. Marks the recipe
 * as bookmarked in the state if the recipe is a bookmark.
 * @param {string} id The recipe ID.
 */
export const getRecipe = async function (id) {
  try {
    const res = await AJAX(`${API_URL}${id}?key=${API_KEY}`);

    state.recipe = createRecipeObject(res.data.recipe);

    if (state.bookmarks.some(bookmark => bookmark.id === id)) {
      state.recipe.bookmarked = true;
    } else {
      state.recipe.bookmarked = false;
    }
  } catch (err) {
    throw err;
  }
};

/**
 * Search the API for all recipes containing the query string. Sets state.results[]
 * to results.
 * @param {string} query What to search for.
 * @example getSearchResults("pizza");
 */
export const getSearchResults = async function (query) {
  try {
    state.search.query = query;

    // Include recipes created by the user api key in search results.
    const response = await AJAX(`${API_URL}?search=${query}&key=${API_KEY}`);

    const results = response.data.recipes;

    state.search.results = results.map(recipe => {
      return {
        id: recipe.id,
        title: recipe.title,
        publisher: recipe.publisher,
        image: recipe.image_url,
        ...(recipe.key && { key: recipe.key }),
      };
    });

    state.search.page = 1; // Resets current page
  } catch (error) {
    throw error;
  }
};

/**
 * Gets the recipes from the results that should be displayed based on the
 * current page.
 * If another page is specified, set the current page to the specified page
 * before getting
 * the recipes.
 * @param {number} [page] Is set as the current page.
 * @returns {object[]} The recipes in the current page.
 */
export const getSearchResultsPage = function (page = state.search.page) {
  state.search.page = page;
  const start = (page - 1) * state.search.resultsPerPage;
  const end = page * state.search.resultsPerPage;
  return state.search.results.slice(start, end);
};

/**
 * Updates the quantity of each ingredient in the current recipe based on
 * the number of servings.
 * @param {number} newServings The new number of servings the current recipe
 * should make.
 */
export const updateServings = function (newServings) {
  state.recipe.ingredients.forEach(ing => {
    ing.quantity = (ing.quantity * newServings) / state.recipe.servings;
  });
  state.recipe.servings = newServings;
};

/**
 * Saves the current bookmarked recipes to localStorage.
 */
const storeBookmarks = function () {
  localStorage.setItem('bookmarks', JSON.stringify(state.bookmarks));
};

/**
 * Marks specified recipe as bookmarked and adds it to state.bookmarks.
 * Updates bookmarks in localStorage.
 * @param {object} recipe The recipe to be bookmarked.
 */
export const addBookmark = function (recipe) {
  // Mark current recipe as bookmarked
  if (recipe.id === state.recipe.id) state.recipe.bookmarked = true;

  // Add recipe object to bookmarks
  state.bookmarks.push(recipe);

  storeBookmarks();
};

/**
 * Unmarks the specified recipe as bookmarked and removes it from
 * state.bookmarks .
 * Updates bookmarks in localStorage.
 * @param {object} recipe The recipe to remove from bookmarks.
 */
export const deleteBookmark = function (recipe) {
  const index = state.bookmarks.findIndex(
    bookmark => bookmark.id === recipe.id
  );
  state.bookmarks.splice(index, 1);

  if (recipe.id === state.recipe.id) state.recipe.bookmarked = false;

  storeBookmarks();
};

/**
 * Checks the new recipe ingredients for input errors and joins them into a new
 * ingredients property. The recipe object is formatted in a way that the API can understand.
 * Sets the new recipe as the current recipe when finished.
 * @summary Uploads a new, user-created recipe to the API.
 * @param {object} newRecipe The user-created recipe to store in the API.
 */
export const uploadRecipe = async function (newRecipe) {
  try {
    // Ingredient 1: "quantity,unit,description" -> [quantity, unit, description]
    // Ingredient 2: ...
    const ingredients = Object.entries(newRecipe)
      .filter(entry => entry[0].startsWith('ingredient') && entry[1] !== '')
      .map(ing => {
        const ingArr = ing[1].split(',').map(element => element.trim());

        // Input validation
        if (ingArr.length !== 3)
          throw new Error(
            'Wrong ingredient format! Please use the correct format (quantity,unit,description).'
          );

        const [quantity, unit, description] = ingArr;

        return {
          quantity: quantity ? Number(quantity) : null,
          unit,
          description,
        };
      }); // This could be refactored into its own function.

    // Recipe object that will be sent to API.
    const recipe = {
      title: newRecipe.title,
      source_url: newRecipe.sourceUrl,
      image_url: newRecipe.image,
      publisher: newRecipe.publisher,
      cooking_time: +newRecipe.cookingTime,
      servings: +newRecipe.servings,
      ingredients,
    };

    const response = await AJAX(`${API_URL}?key=${API_KEY}`, recipe);
    console.log(response);
    state.recipe = createRecipeObject(response.data.recipe);
    addBookmark(state.recipe);
  } catch (error) {
    throw error;
  }
};

/** Loads bookmarked recipes from localStorage. */
const init = function () {
  const storage = localStorage.getItem('bookmarks');

  if (!storage) return;

  state.bookmarks = JSON.parse(storage);
};

init();

/**
 * Clears bookmarks in localStorage. Used for testing/debugging.
 */
const clearBookmarks = function () {
  localStorage.clear('bookmarks');
};
// clearBookmarks();
