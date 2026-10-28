// eventListenerReducer.js
import { LISTEN_TO_EVENT, STOP_LISTENING_TO_EVENT } from '../actions'; // Replace with the correct path

const initialState = {
    lastEvent: null,
    // Add any other relevant properties related to event listening
};

const eventListenerReducer = (state = initialState, action) => {
    switch (action.type) {
        case LISTEN_TO_EVENT:
            // Handle the event listening logic if needed
            return state;

        case STOP_LISTENING_TO_EVENT:
            // Handle the event listening stop logic if needed
            return state;

        // You can add more cases for different actions if needed

        default:
            return state;
    }
};

export default eventListenerReducer;
