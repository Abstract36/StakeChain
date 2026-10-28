import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { stakingApi } from './components/slices/apiSlice';

// Import your application's reducers
import userReducer from './components/slices/userSlice';
import walletReducer from './components/slices/walletSlice';
import transactionReducer from './components/slices/transactionSlice';
import smartContractReducer from './components/slices/smartContractSlice';
import tokenReducer from './components/slices/tokenSlice';
import blockchainConnectionReducer from './components/slices/blockchainConnectionSlice';
import notificationReducer from './components/slices/notificationSlice';
import settingsReducer from './components/slices/settingsSlice';
import errorReducer from './components/slices/errorSlice';
import analyticsReducer from './components/slices/analyticsSlice';
import securityReducer from './components/slices/securitySlice';
import historyReducer from './components/slices/historySlice';
import integrationReducer from './components/slices/integrationsSlice';
import eventListenerReducer from './components/slices/eventlistenerSlice';
import contractInteractionsReducer from './components/slices/contractInteractionsSlice';

// Combine your application's reducers
const rootReducer = combineReducers({
  user: userReducer,
  wallet: walletReducer,
  transaction: transactionReducer,
  smartContract: smartContractReducer,
  token: tokenReducer,
  blockchainConnection: blockchainConnectionReducer,
  notification: notificationReducer,
  settings: settingsReducer,
  error: errorReducer,
  analytics: analyticsReducer,
  security: securityReducer,
  history: historyReducer,
  integration: integrationReducer,
  eventListener: eventListenerReducer,
  contractInteractions: contractInteractionsReducer,
  // Add other reducers here
  [stakingApi.reducerPath]: stakingApi.reducer, // Add the API reducer
});

// Configure the Redux store
const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(stakingApi.middleware), // Add the API middleware
});

// Enable refetchOnMount and refetchOnReconnect behaviors for the API
setupListeners(store.dispatch);

export default store;
