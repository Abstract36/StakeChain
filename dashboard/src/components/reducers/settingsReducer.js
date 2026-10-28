// settingsReducer.js

// Define the initial state for settings
const initialState = {
    theme: 'light', // You can initialize it to a default theme
    language: 'en', // You can initialize it to a default language
    // Add other settings-related properties as needed
  };
  
  // Define action types
  const SET_THEME = 'SET_THEME';
  const SET_LANGUAGE = 'SET_LANGUAGE';
  
  // Define action creators
  export const setTheme = (theme) => ({
    type: SET_THEME,
    payload: theme,
  });
  
  export const setLanguage = (language) => ({
    type: SET_LANGUAGE,
    payload: language,
  });
  
  // Define the settings reducer function
  const settingsReducer = (state = initialState, action) => {
    switch (action.type) {
      case SET_THEME:
        return {
          ...state,
          theme: action.payload,
        };
      case SET_LANGUAGE:
        return {
          ...state,
          language: action.payload,
        };
      // Add other cases for handling different actions related to settings
      default:
        return state;
    }
  };
  
  export default settingsReducer;
  