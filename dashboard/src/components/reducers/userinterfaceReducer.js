// userInterfaceReducer.js
import { SWAP_ACTION, DEX_ACTION, POOLS_ACTION, FARM_ACTION } from '../actions/actionTypes.js';

const initialState = {
    // You can include additional properties related to the user interface state
    currentAction: null,
};

const userInterfaceReducer = (state = initialState, action) => {
    switch (action.type) {
        case SWAP_ACTION:
            return {
                ...state,
                currentAction: 'SWAP',
            };

        case DEX_ACTION:
            return {
                ...state,
                currentAction: 'DEX',
            };

        case POOLS_ACTION:
            return {
                ...state,
                currentAction: 'POOLS',
            };

        case FARM_ACTION:
            return {
                ...state,
                currentAction: 'FARM',
            };

        // You can add more cases for different actions if needed

        default:
            return state;
    }
};

export default userInterfaceReducer;
