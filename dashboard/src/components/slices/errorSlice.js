import { createSlice } from '@reduxjs/toolkit';

// Define the initial state for error handling
const initialState = {
  error: null, // You can initialize it to null
  // Add other error-related properties as needed
};

// Create the errorSlice
const errorSlice = createSlice({
  name: 'error',
  initialState,
  reducers: {
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    // Add other cases for handling different actions related to error management
  },
});

// Export the actions
export const { setError, clearError } = errorSlice.actions;

// Export the reducer
export default errorSlice.reducer;
