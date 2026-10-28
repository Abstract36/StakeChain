// historyReducer.js

// Define the initial state for navigation history
const initialState = {
    history: [], // You can initialize it as an empty array
    // Add other history-related properties as needed
  };
  
  // Define action types
  const PUSH_TO_HISTORY = 'PUSH_TO_HISTORY';
  const POP_FROM_HISTORY = 'POP_FROM_HISTORY';
  
  // Define action creators
  export const pushToHistory = (location) => ({
    type: PUSH_TO_HISTORY,
    payload: location,
  });
  
  export const popFromHistory = () => ({
    type: POP_FROM_HISTORY,
  });
  
  // Define the history reducer function
  const historyReducer = (state = initialState, action) => {
    switch (action.type) {
      case PUSH_TO_HISTORY:
        return {
          ...state,
          history: [...state.history, action.payload],
        };
      case POP_FROM_HISTORY:
        const updatedHistory = [...state.history];
        updatedHistory.pop();
        return {
          ...state,
          history: updatedHistory,
        };
      // Add other cases for handling different actions related to history
      default:
        return state;
    }
  };
  
  export default historyReducer;
  