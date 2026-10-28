// eventActions.js

// Import the action types
import { LISTEN_TO_EVENT, STOP_LISTENING_TO_EVENT } from '../actions/actionTypes' // Replace with the correct path

// Action creator for LISTEN_TO_EVENT
export const listenToEvent = () => ({
    type: LISTEN_TO_EVENT,
});

// Action creator for STOP_LISTENING_TO_EVENT
export const stopListeningToEvent = () => ({
    type: STOP_LISTENING_TO_EVENT,
});

// Async action creator to simulate event listening
export const simulateEventListening = () => (dispatch) => {
    // Simulate listening to an event (replace with actual event listening logic)
    const eventListener = setInterval(() => {
        const lastEvent = new Date().toLocaleTimeString();
        dispatch({
            type: LISTEN_TO_EVENT,
            payload: {
                lastEvent,
            },
        });
    }, 3000); // Simulate every 3 seconds

    // Return a function to stop event listening when needed
    return () => {
        clearInterval(eventListener);
        dispatch(stopListeningToEvent());
    };
};
