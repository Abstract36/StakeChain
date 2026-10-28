// tokenReducer.js

// Define the initial state for token data
const initialState = {
    tokens: [], // You can initialize it as an empty array
    // Add other token-related properties as needed
  };
  
  // Define action types
  const ADD_TOKEN = 'ADD_TOKEN';
  const REMOVE_TOKEN = 'REMOVE_TOKEN';
  
  // Define action creators
  export const addToken = (token) => ({
    type: ADD_TOKEN,
    payload: token,
  });
  
  export const removeToken = (tokenId) => ({
    type: REMOVE_TOKEN,
    payload: tokenId,
  });
  
  // Define the token reducer function
  const tokenReducer = (state = initialState, action) => {
    switch (action.type) {
      case ADD_TOKEN:
        return {
          ...state,
          tokens: [...state.tokens, action.payload],
        };
      case REMOVE_TOKEN:
        const updatedTokens = state.tokens.filter(
          (token) => token.id !== action.payload
        );
        return {
          ...state,
          tokens: updatedTokens,
        };
      // Add other cases for handling different actions related to tokens
      default:
        return state;
    }
  };
  
  export default tokenReducer;
  