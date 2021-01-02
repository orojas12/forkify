import { API_URL, API_KEY, RESULTS_PER_PAGE } from './config.js';
import { AJAX } from './helpers.js';

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

const createRecipeObject = function (data) {
  return {
    id: data.id,
    title: data.title,
    publisher: data.publisher,
    sourceUrl: data.source_url,
    image: data.image_url,
    cookingTime: +data.cooking_time,
    servings: +data.servings,
    ingredients: data.ingredients,
    ...(data.key && { key: data.key }),
  };
};

export const getRecipe = async function (id) {
  try {
    const res = await AJAX(`${API_URL}${id}?key=${API_KEY}`);

    state.recipe = createRecipeObject(res.data.recipe);

    if (state.bookmarks.some(bookmark => bookmark.id === id))
      state.recipe.bookmarked = true;
    else state.recipe.bookmarked = false;
  } catch (err) {
    throw err;
  }
};

export const getSearchResults = async function (query) {
  try {
    state.search.query = query;

    const data = await AJAX(`${API_URL}?search=${query}&key=${API_KEY}`);

    // Reset results page to 1
    state.search.page = 1;

    state.search.results = data.data.recipes.map(recipe => {
      return {
        id: recipe.id,
        title: recipe.title,
        publisher: recipe.publisher,
        image: recipe.image_url,
        ...(recipe.key && { key: recipe.key }),
      };
    });
  } catch (error) {
    throw error;
  }
};

export const getSearchResultsPage = function (page = state.search.page) {
  state.search.page = page;
  const start = (page - 1) * state.search.resultsPerPage;
  const end = page * state.search.resultsPerPage;
  return state.search.results.slice(start, end);
};

export const updateServings = function (newServings) {
  state.recipe.ingredients.forEach(ing => {
    ing.quantity = (ing.quantity * newServings) / state.recipe.servings;
  });
  state.recipe.servings = newServings;
};

const storeBookmarks = function () {
  localStorage.setItem('bookmarks', JSON.stringify(state.bookmarks));
};

export const addBookmark = function (recipe) {
  // Add recipe object to bookmarks
  state.bookmarks.push(recipe);

  // Mark current recipe as bookmarked
  if (recipe.id === state.recipe.id) state.recipe.bookmarked = true;

  storeBookmarks();
};

export const deleteBookmark = function (recipe) {
  const index = state.bookmarks.findIndex(
    bookmark => bookmark.id === recipe.id
  );
  state.bookmarks.splice(index, 1);

  // Mark current recipe as not bookmarked
  if (recipe.id === state.recipe.id) state.recipe.bookmarked = false;

  storeBookmarks();
};

export const uploadRecipe = async function (newRecipe) {
  try {
    const ingredients = Object.entries(newRecipe)
      .filter(entry => entry[0].startsWith('ingredient') && entry[1] !== '')
      .map(ing => {
        const ingArr = ing[1].replaceAll(' ', '').split(',');

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
      });

    const recipe = {
      title: newRecipe.title,
      source_url: newRecipe.sourceUrl,
      image_url: newRecipe.image,
      publisher: newRecipe.publisher,
      cooking_time: +newRecipe.cookingTime,
      servings: +newRecipe.servings,
      ingredients,
    };

    const res = await AJAX(`${API_URL}?key=${API_KEY}`, recipe);
    state.recipe = createRecipeObject(res.data.recipe);
    addBookmark(state.recipe);
  } catch (error) {
    throw error;
  }
};

const init = function () {
  const storage = localStorage.getItem('bookmarks');

  if (!storage) return;

  state.bookmarks = JSON.parse(storage);
};

init();

/**
 * Prevent bookmarks from being saved to localStorage. Used for testing/debugging.
 */
const clearBookmarks = function () {
  localStorage.clear('bookmarks');
};
// clearBookmarks();
