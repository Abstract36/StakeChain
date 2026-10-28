// contractReducer.js

import { CONTRACT_INTERACTION_REQUEST, CONTRACT_INTERACTION_ERROR } from '../actions/actionTypes'; // Replace with the correct path

const initialState = {
    result: null,
    error: null,
};

const contractReducer = (state = initialState, action) => {
    switch (action.type) {
        case CONTRACT_INTERACTION_REQUEST:
            return {
                ...state,
                result: action.payload.result,
                error: null,
            };

        case CONTRACT_INTERACTION_ERROR:
            return {
                ...state,
                result: null,
                error: action.payload.error,
            };

        // Add other cases for different actions if needed

        default:
            return state;
    }
};

export default contractReducer;
