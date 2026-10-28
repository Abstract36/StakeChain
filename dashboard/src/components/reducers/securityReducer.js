// securityReducer.js

// Define the initial state for security
const initialState = {
    isAuthenticated: false, // You can initialize it to false
    userRoles: [], // You can initialize it as an empty array
    // Add other security-related properties as needed
  };
  
  // Define action types
  const SET_AUTHENTICATION = 'SET_AUTHENTICATION';
  const SET_USER_ROLES = 'SET_USER_ROLES';
  
  // Define action creators
  export const setAuthentication = (isAuthenticated) => ({
    type: SET_AUTHENTICATION,
    payload: isAuthenticated,
  });
  
  export const setUserRoles = (roles) => ({
    type: SET_USER_ROLES,
    payload: roles,
  });
  
  // Define the security reducer function
  const securityReducer = (state = initialState, action) => {
    switch (action.type) {
      case SET_AUTHENTICATION:
        return {
          ...state,
          isAuthenticated: action.payload,
        };
      case SET_USER_ROLES:
        return {
          ...state,
          userRoles: action.payload,
        };
      // Add other cases for handling different actions related to security
      default:
        return state;
    }
  };
  
  export default securityReducer;
  