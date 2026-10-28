// smartContractReducer.js

// Define the initial state for smart contract data
const initialState = {
    contracts: [], // You can initialize it as an empty array
    // Add other smart contract-related properties as needed
  };
  
  // Define action types
  const ADD_CONTRACT = 'ADD_CONTRACT';
  const REMOVE_CONTRACT = 'REMOVE_CONTRACT';
  
  // Define action creators
  export const addContract = (contract) => ({
    type: ADD_CONTRACT,
    payload: contract,
  });
  
  export const removeContract = (contractId) => ({
    type: REMOVE_CONTRACT,
    payload: contractId,
  });
  
  // Define the smart contract reducer function
  const smartContractReducer = (state = initialState, action) => {
    switch (action.type) {
      case ADD_CONTRACT:
        return {
          ...state,
          contracts: [...state.contracts, action.payload],
        };
      case REMOVE_CONTRACT:
        const updatedContracts = state.contracts.filter(
          (contract) => contract.id !== action.payload
        );
        return {
          ...state,
          contracts: updatedContracts,
        };
      // Add other cases for handling different actions related to smart contracts
      default:
        return state;
    }
  };
  
  export default smartContractReducer;
  