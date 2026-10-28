// eventListenerSlice.js
import { createSlice } from '@reduxjs/toolkit';

// Define the initial state
const initialState = {
    lastEvent: null,
    // Add any other relevant properties related to event listening
};

// Create the eventListenerSlice
const eventListenerSlice = createSlice({
    name: 'eventListener',
    initialState,
    reducers: {
        updateLastEvent: (state, action) => {
            state.lastEvent = action.payload;
        },
        // Add more actions as needed for event listening
    },
});

// Export the actions
export const { updateLastEvent } = eventListenerSlice.actions;

// Export the reducer
export default eventListenerSlice.reducer;
