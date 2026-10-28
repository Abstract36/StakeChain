// ContractInteractionContainer.js

import { connect } from 'react-redux';
import ContractInteraction from './ContractInteraction'; // Assuming the presentational component is in the same directory

// Connect the container to Redux store
const mapStateToProps = (state) => ({
    contractInteraction: state.contractInteraction,
});

const mapDispatchToProps = (dispatch) => ({
    dispatchContractInteraction: async (data) => {
        // Same implementation as in ContractInteraction.jsx
        const provider = new ethers.providers.JsonRpcProvider('YOUR_JSON_RPC_URL');
        const wallet = new ethers.Wallet('YOUR_PRIVATE_KEY', provider);

        const contractAddress = 'YOUR_CONTRACT_ADDRESS';
        const contract = new ethers.Contract(contractAddress, ['YOUR_CONTRACT_ABI'], wallet);

        const result = await contract.someInteractionFunction(data);
        dispatch(contractInteractionRequest(result));

        return result;
    },
});

// Connect the container to the presentational component
const ContractInteractionContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(ContractInteraction);

export default ContractInteractionContainer;
