// notificationReducer.js

// Define the initial state for notifications
const initialState = {
    notifications: [], // You can initialize it as an empty array
    // Add other notification-related properties as needed
  };
  
  // Define action types
  const ADD_NOTIFICATION = 'ADD_NOTIFICATION';
  const REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION';
  const CLEAR_NOTIFICATIONS = 'CLEAR_NOTIFICATIONS';
  
  // Define action creators
  export const addNotification = (notification) => ({
    type: ADD_NOTIFICATION,
    payload: notification,
  });
  
  export const removeNotification = (notificationId) => ({
    type: REMOVE_NOTIFICATION,
    payload: notificationId,
  });
  
  export const clearNotifications = () => ({
    type: CLEAR_NOTIFICATIONS,
  });
  
  // Define the notification reducer function
  const notificationReducer = (state = initialState, action) => {
    switch (action.type) {
      case ADD_NOTIFICATION:
        return {
          ...state,
          notifications: [...state.notifications, action.payload],
        };
      case REMOVE_NOTIFICATION:
        const updatedNotifications = state.notifications.filter(
          (notification) => notification.id !== action.payload
        );
        return {
          ...state,
          notifications: updatedNotifications,
        };
      case CLEAR_NOTIFICATIONS:
        return {
          ...state,
          notifications: [],
        };
      // Add other cases for handling different actions related to notifications
      default:
        return state;
    }
  };
  
  export default notificationReducer;
  