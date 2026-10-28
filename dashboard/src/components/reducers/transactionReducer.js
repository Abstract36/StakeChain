// walletReducer.js

// Define the initial state for the wallet
const initialState = {
    balance: 0,
    transactions: [],
    // Add other wallet-related properties as needed
  };
  
  // Define action types
  const SET_BALANCE = 'SET_BALANCE';
  const ADD_TRANSACTION = 'ADD_TRANSACTION';
  
  // Define action creators
  export const setBalance = (balance) => ({
    type: SET_BALANCE,
    payload: balance,
  });
  
  export const addTransaction = (transaction) => ({
    type: ADD_TRANSACTION,
    payload: transaction,
  });
  
  // Define the wallet reducer function
  const walletReducer = (state = initialState, action) => {
    switch (action.type) {
      case SET_BALANCE:
        return {
          ...state,
          balance: action.payload,
        };
      case ADD_TRANSACTION:
        return {
          ...state,
          transactions: [...state.transactions, action.payload],
        };
      // Add other cases for handling different actions
      default:
        return state;
    }
  };
  
  export default walletReducer;
  