// errorReducer.js

// Define the initial state for error handling
const initialState = {
    error: null, // You can initialize it to null
    // Add other error-related properties as needed
  };
  
  // Define action types
  const SET_ERROR = 'SET_ERROR';
  const CLEAR_ERROR = 'CLEAR_ERROR';
  
  // Define action creators
  export const setError = (error) => ({
    type: SET_ERROR,
    payload: error,
  });
  
  export const clearError = () => ({
    type: CLEAR_ERROR,
  });
  
  // Define the error reducer function
  const errorReducer = (state = initialState, action) => {
    switch (action.type) {
      case SET_ERROR:
        return {
          ...state,
          error: action.payload,
        };
      case CLEAR_ERROR:
        return {
          ...state,
          error: null,
        };
      // Add other cases for handling different actions related to error management
      default:
        return state;
    }
  };
  
  export default errorReducer;
  