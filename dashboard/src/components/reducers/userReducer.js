// userReducer.js

// Define the initial state for user data
const initialState = {
    user: null, // You can initialize it to null or an empty object
    isAuthenticated: false, // You can initialize it to false
    // Add other user-related properties as needed
  };
  
  // Define action types
  const SET_USER = 'SET_USER';
  const SET_AUTHENTICATION = 'SET_AUTHENTICATION';
  
  // Define action creators
  export const setUser = (userData) => ({
    type: SET_USER,
    payload: userData,
  });
  
  export const setAuthentication = (isAuthenticated) => ({
    type: SET_AUTHENTICATION,
    payload: isAuthenticated,
  });
  
  // Define the user reducer function
  const userReducer = (state = initialState, action) => {
    switch (action.type) {
      case SET_USER:
        return {
          ...state,
          user: action.payload,
        };
      case SET_AUTHENTICATION:
        return {
          ...state,
          isAuthenticated: action.payload,
        };
      // Add other cases for handling different actions related to user data
      default:
        return state;
    }
  };
  
  export default userReducer;
  