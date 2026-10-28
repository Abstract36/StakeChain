// UserInterfaceContainer.jsx

import { connect } from 'react-redux';
import UserInterface from './UserInterface'; // Replace with the correct path to your UserInterface component
import { swapAction, dexAction, poolsAction, farmAction } from '../actions/userInterfaceActions'; // Replace with your actual actions

const mapStateToProps = (state) => ({
    // Map any necessary state properties to props
    // Example: prop1: state.someReducer.prop1,
});

const mapDispatchToProps = (dispatch) => ({
    dispatchSwap: () => dispatch(swapAction()),
    dispatchDex: () => dispatch(dexAction()),
    dispatchPools: () => dispatch(poolsAction()),
    dispatchFarm: () => dispatch(farmAction()),
});

const UserInterfaceContainer = connect(mapStateToProps, mapDispatchToProps)(UserInterface);

export default UserInterfaceContainer;
