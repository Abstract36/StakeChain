// userInterfaceSlice.js
import { createSlice } from '@reduxjs/toolkit';

// Define the initial state
const initialState = {
    currentAction: null,
};

// Create the userInterfaceSlice
const userInterfaceSlice = createSlice({
    name: 'userInterface',
    initialState,
    reducers: {
        setSwapAction: (state) => {
            state.currentAction = 'SWAP';
        },
        setDexAction: (state) => {
            state.currentAction = 'DEX';
        },
        setPoolsAction: (state) => {
            state.currentAction = 'POOLS';
        },
        setFarmAction: (state) => {
            state.currentAction = 'FARM';
        },
    },
});

// Export the actions
export const { setSwapAction, setDexAction, setPoolsAction, setFarmAction } = userInterfaceSlice.actions;

// Export the reducer
export default userInterfaceSlice.reducer;
