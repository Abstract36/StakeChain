// contractInteractionsSlice.js
import { createSlice } from '@reduxjs/toolkit';

// Define the initial state
const initialState = {
    result: null,
    loading: false,
    error: null,
};

// Create the contractInteractionsSlice
const contractInteractionsSlice = createSlice({
    name: 'contractInteractions',
    initialState,
    reducers: {
        contractInteractionRequest: (state, action) => {
            state.result = action.payload;
            state.loading = false;
            state.error = null;
        },
        contractInteractionLoading: (state) => {
            state.loading = true;
        },
        contractInteractionError: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
    },
});

// Export the actions
export const { contractInteractionRequest, contractInteractionLoading, contractInteractionError } = contractInteractionsSlice.actions;

// Export the reducer
export default contractInteractionsSlice.reducer;
