Installation
From the directory of this file, run:

sudo npm install -g vsce
npm install
vsce package
code --install-extension cairo*.vsix

Configuration
If you have cairo-format installed globally (available in PATH), the value of cairo.cairoFormatPath should be cairo-format (the default).

If you're working inside a StarkWare repository, and want the most up-to-date version, set the value of cairo.cairoFormatPath to

${workspaceFolder}/src/starkware/cairo/lang/scripts/cairo-format

Run the extension (for development)
Open VSCode in the directory of the extension.
Run:
npm install
npm run compile

Reload VSCode.
Press F5.


Developing on the Cairo language with StarkWare involves several steps and tools. Here's a breakdown of the typical development process:

1. **VS Code with Cairo Plugin**: 
   - **Initial Setup**: The development process often begins with setting up a proper coding environment. Visual Studio Code (VS Code) is a popular choice due to its versatility and robust ecosystem of extensions.
   - **Cairo Plugin**: A Cairo plugin for VS Code provides syntax highlighting, code completion, and other helpful features specific to the Cairo language, making it easier to write and understand Cairo code.

2. **Building on Scarb**:
   - **Scarb Usage**: Scarb is a build system for Cairo. It helps in compiling and managing Cairo projects, similar to how build systems like `make` work in other programming environments.
   - **Functionality**: With Scarb, you can easily compile your Cairo code, manage dependencies, and package your project for deployment.

3. **Testing and Debugging**:
   - **Foundry (Forge)** or **Hardhat + Starknet Plugin**:
     - **Foundry (Forge)**: Foundry is a development environment, testing framework, and deployment tool. Forge is the component of Foundry specifically used for compiling and testing smart contracts.
     - **Hardhat with Starknet Plugin**: Hardhat is a development environment for Ethereum, and the Starknet plugin extends its capabilities to the StarkNet ecosystem. This setup is particularly useful for developers comfortable with JavaScript, as Hardhat scripts are written in JavaScript.

4. **Running on Devnet**:
   - **Scarb for Compiling and Packaging**: After building the project with Scarb, the next step is to run it on a development network (devnet) like Starknet-devnet or Katana.
   - **Purpose**: Running on a devnet allows developers to simulate how the contract would behave on the mainnet, without the risks associated with deploying on the main blockchain network.

5. **Contract Deployment**:
   - **Foundry (Cast)** or **Starkli**:
     - **Foundry (Cast)**: Cast is another component of Foundry, used for interacting with Ethereum-like networks, including StarkNet.
     - **Starkli**: Starkli is a command-line interface (CLI) tool specifically designed for interacting with StarkNet. It facilitates the deployment of contracts to the StarkNet blockchain.

6. **Package Delivery Using Scarb**:
   - After the contract is tested and ready for deployment, Scarb can be used again to package and deliver the final product.

Each of these steps involves specific tools and processes tailored to the StarkWare ecosystem and the Cairo language. This workflow ensures that developers can write, test, debug, and deploy their Cairo contracts efficiently and effectively, with a focus on the unique aspects of the StarkWare environment.