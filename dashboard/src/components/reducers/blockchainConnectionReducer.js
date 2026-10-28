// blockchainConnectionReducer.js

// Define the initial state for blockchain connection status
const initialState = {
    isConnected: false, // You can initialize it to false
    blockchainProvider: null,
    // Add other blockchain-related properties as needed
  };
  
  // Define action types
  const CONNECT_TO_BLOCKCHAIN = 'CONNECT_TO_BLOCKCHAIN';
  const DISCONNECT_FROM_BLOCKCHAIN = 'DISCONNECT_FROM_BLOCKCHAIN';
  
  // Define action creators
  export const connectToBlockchain = (provider) => ({
    type: CONNECT_TO_BLOCKCHAIN,
    payload: provider,
  });
  
  export const disconnectFromBlockchain = () => ({
    type: DISCONNECT_FROM_BLOCKCHAIN,
  });
  
  // Define the blockchain connection reducer function
  const blockchainConnectionReducer = (state = initialState, action) => {
    switch (action.type) {
      case CONNECT_TO_BLOCKCHAIN:
        return {
          ...state,
          isConnected: true,
          blockchainProvider: action.payload,
        };
      case DISCONNECT_FROM_BLOCKCHAIN:
        return {
          ...state,
          isConnected: false,
          blockchainProvider: null,
        };
      // Add other cases for handling different actions
      default:
        return state;
    }
  };
  
  export default blockchainConnectionReducer;
  