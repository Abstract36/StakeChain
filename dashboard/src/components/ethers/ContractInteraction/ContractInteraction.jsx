import React, { useState } from 'react';
import { connect } from 'react-redux';
import { contractInteractionRequest } from '../actions/contractActions';
import { ethers } from 'ethers';

const ContractInteraction = ({ contractInteraction, dispatchContractInteraction }) => {
    const [interactionData, setInteractionData] = useState('');

    const handleInteraction = async () => {
        try {
            // Assuming you want to send an interaction to the contract
            const result = await dispatchContractInteraction(interactionData);
            console.log('Interaction Result:', result);
        } catch (error) {
            console.error('Error during contract interaction:', error.message);
        }
    };

    return (
        <div>
            <h2>Contract Interaction</h2>
            <div>
                <label>Data:</label>
                <input
                    type="text"
                    value={interactionData}
                    onChange={(e) => setInteractionData(e.target.value)}
                />
            </div>
            <button onClick={handleInteraction}>Interact with Contract</button>
            <div>
                <p>Result: {contractInteraction.result}</p>
            </div>
        </div>
    );
};

// Connect the component to Redux store
const mapStateToProps = (state) => ({
    contractInteraction: state.contractInteraction,
});

const mapDispatchToProps = (dispatch) => ({
    dispatchContractInteraction: async (data) => {
        const provider = new ethers.providers.JsonRpcProvider('YOUR_JSON_RPC_URL');
        const wallet = new ethers.Wallet('YOUR_PRIVATE_KEY', provider);

        // Assuming you want to send an interaction to a specific contract
        const contractAddress = 'YOUR_CONTRACT_ADDRESS';
        const contract = new ethers.Contract(contractAddress, ['YOUR_CONTRACT_ABI'], wallet);

        // Perform the contract interaction and dispatch the result to Redux
        const result = await contract.someInteractionFunction(data);
        dispatch(contractInteractionRequest(result));

        return result;
    },
});

export default connect(mapStateToProps, mapDispatchToProps)(ContractInteraction);
