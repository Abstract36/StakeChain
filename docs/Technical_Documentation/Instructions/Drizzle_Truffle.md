Drizzle's architecture is highly modular, allowing users to integrate as much or as little as they need. It primarily consists of two packages designed for React, but its core functionalities are housed in the base drizzle module. This makes it adaptable for various applications, including Angular libraries or non-webapp uses, especially for those familiar with Redux. Here's a breakdown of its components:

1. **Drizzle**: The core library that handles web3, account, and contract instantiation. It manages necessary synchronizations and provides additional contract functionality.

2. **drizzle-react**: This package includes a `DrizzleProvider` component and a `drizzleConnect` helper method, simplifying the integration of Drizzle with React applications.

3. **drizzle-react-components**: This library offers useful components for common decentralized application (dapp) functions, such as `ContractData`, `ContractForm`, and `LoadingContainer`.

**Drizzle React Components**:

- These components are designed for common UI elements in dapps.

**Installation**:

- Drizzle React Components can be installed via npm with `npm install --save drizzle-react-components`. Note that `drizzle-react` is also required.

**Components**:

- **LoadingContainer**: This component wraps around the entire app (within `DrizzleProvider`) and displays a loading screen until Drizzle, web3, and your contracts are initialized. It features `loadingComp` and `errorComp` components for display during initialization and in case of initialization failure, respectively.

- **ContractData**: A component requiring the contract's name and the method to call. It supports method arguments, options to hide loading indicators, and conversion of return values to UTF-8 or ASCII strings.

- **ContractForm**: This component is used for creating forms based on a contract's method. It requires the contract's name and method, and supports sending arguments (like gas price, value), as well as custom labels for a more user-friendly interface.