// EventListener.jsx

import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { listenToEvent, stopListeningToEvent } from '../actions/eventActions';

function EventListener({ eventListener, dispatchListenToEvent, dispatchStopListeningToEvent }) {
    useEffect(() => {
        // Start listening to the event when the component mounts
        dispatchListenToEvent();

        // Stop listening to the event when the component unmounts
        return () => {
            dispatchStopListeningToEvent();
        };
    }, [dispatchListenToEvent, dispatchStopListeningToEvent]);

    return (
        <div>
            <h2>Event Listener</h2>
            <div>
                <p>Last Event: {eventListener.lastEvent}</p>
            </div>
        </div>
    );
}

// Connect the component to the Redux store
const mapStateToProps = (state) => ({
    eventListener: state.eventListener,
});

const mapDispatchToProps = (dispatch) => ({
    dispatchListenToEvent: () => dispatch(listenToEvent()),
    dispatchStopListeningToEvent: () => dispatch(stopListeningToEvent()),
});

export default connect(mapStateToProps, mapDispatchToProps)(EventListener);
