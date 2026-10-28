// integrationReducer.js

// Define the initial state for integration status
const initialState = {
    isIntegrated: false, // You can initialize it to false
    integrationService: null,
    // Add other integration-related properties as needed
  };
  
  // Define action types
  const SET_INTEGRATION = 'SET_INTEGRATION';
  const REMOVE_INTEGRATION = 'REMOVE_INTEGRATION';
  
  // Define action creators
  export const setIntegration = (service) => ({
    type: SET_INTEGRATION,
    payload: service,
  });
  
  export const removeIntegration = () => ({
    type: REMOVE_INTEGRATION,
  });
  
  // Define the integration reducer function
  const integrationReducer = (state = initialState, action) => {
    switch (action.type) {
      case SET_INTEGRATION:
        return {
          ...state,
          isIntegrated: true,
          integrationService: action.payload,
        };
      case REMOVE_INTEGRATION:
        return {
          ...state,
          isIntegrated: false,
          integrationService: null,
        };
      // Add other cases for handling different actions related to integration
      default:
        return state;
    }
  };
  
  export default integrationReducer;
  