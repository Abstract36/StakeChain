https://github.com/xJonathanLEI/starkli/
https://github.com/starknet-io/starknet.js
https://github.com/foundry-rs/starknet-foundry/
https://github.com/groksmith/starkware-remix-plugin
https://github-com.translate.goog/starkware-libs/starkex-core/?_x_tr_sl=en&_x_tr_tl=ru&_x_tr_hl=en&_x_tr_pto=wapp
https://github.com/0xSpaceShard/starknet-devnet
https://github.com/0xSpaceShard/starknet-devnet-rs
https://github.com/0xSpaceShard/starknet-hardhat-plugin
https://github.com/0xSpaceShard/starknet-hardhat-example/tree/master


https://www.starknetjs.com/docs/guides/intro/
https://www.starknet.io/en
https://docs.starknet.io/documentation/
https://docs.starkware.co/starkex/index.html
https://starkware.co/resource/7-devtools-starknet-devs/
https://starkware.co/resource/7-devtools-starknet-devs/#Starknet-devnet
https://docs.starkware.co/starkex/deployments-addresses.html

starknet-devnet, starknet-devnet-rs


# Cheat sheet

# Wallet folder structure
.
├── account.json
├── envars.sh
└── keystore.json

# Environment variables
export STARKNET_RPC=https://starknet-goerli.g.alchemy.com/v2/V0WI...
export STARKNET_ACCOUNT=~/.starkli-wallets/deployer/account.json
export STARKNET_KEYSTORE=~/.starkli-wallets/deployer/keystore.json


# Wallet commands

# Create a keystore file from an existing private key
starkli signer keystore from-key <FILE>

# Check the public key of an existing keystore file
starkli signer keystore inspect <FILE>

# Get contract class hash deployed at a certain address
starkli class-hash-at <ADDRESS>


# Starknet commands

# Declare a contract class
starkli declare <FILE>

# Calculate class hash from any contract artifacts
starkli class-hash <FILE>

# Deploy contract via the Universal Deployer Contract
starkli deploy <CLASS_HASH> [CTOR_ARGS]

# Call contract functions without sending transactions
starkli call <CONTRACT_ADDRESS> <SELECTOR> [ARGS]

# Send an invoke transaction from an account contract (single call)
starkli invoke <CONTRACT_ADDRESS> <SELECTOR> [ARGS]