// userInterfaceActions.js

// Import the action types
import { SWAP_ACTION, DEX_ACTION, POOLS_ACTION, FARM_ACTION } from '../actions/actionTypes' // Replace with the correct path

// Action creators for SWAP_ACTION, DEX_ACTION, POOLS_ACTION, and FARM_ACTION
export const swapAction = () => ({
    type: SWAP_ACTION,
});

export const dexAction = () => ({
    type: DEX_ACTION,
});

export const poolsAction = () => ({
    type: POOLS_ACTION,
});

export const farmAction = () => ({
    type: FARM_ACTION,
});

// Async action creators (if needed) can be added here
