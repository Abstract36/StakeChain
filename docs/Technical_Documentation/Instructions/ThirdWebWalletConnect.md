https://thirdweb.com/dashboard?utm_source=portal


npm install @thirdweb-dev/react @thirdweb-dev/sdk "ethers@^5"
npm i url http-browserify https-browserify browserify-zlib http-browserify https-browserify assert stream
npm i http-browserify
npm i https-browserify
npm i browserify-zlib
npm i http-browserify
npm i https-browserify
npm i assert
npm i stream

   resolve: {
    fallback: {
      "http": require.resolve("http-browserify"),
      "https": require.resolve("https-browserify"),
      "assert": require.resolve("assert"),
      "stream": require.resolve("stream"),
      "zlib": require.resolve("browserify-zlib"),
      "micro-ftch": requite.solve("micro-ftch"),
      "path": require.resolve("path-browserify"),
      "util": require.resolve("util/"),
      "crypto": require.resolve("crypto-browserify"),
      "fs": false,
      "tls": false,
      "net": false,
      "https": false
    },
  },



activeChain (recommended)

The activeChain prop determines which chain you want your app to be operating on.

There are 700+ chains available in the @thirdweb-dev/chains package. Import the chain you want to use from the package and pass it to the activeChain prop. If your chain is not included, see configuring custom chains.
Install Package

Install the @thirdweb-dev/chains package to use non-default chains.
npm install @thirdweb-dev/chains

import { ThirdwebProvider } from "@thirdweb-dev/react";
import { Gnosis } from "@thirdweb-dev/chains";
function MyApp() {
  return (
    <ThirdwebProvider
     authConfig={{
        authUrl: "/api/auth",
        domain: "https://example.com",
        // secureStorage: customSecureStorage, // You can specify a custom secure storage if needed.
      }}
      activeChain={Gnosis}
      clientId="your-client-id"
    >
      <YourApp />
    </ThirdwebProvider>
  );
}
authConfig (optional)

The configuration object for setting up Auth; allowing users to sign in with their wallet.
Property	Type	Description
authUrl	string	The backend URL of the authentication endpoints. For example, if your endpoints are at /api/auth/login, /api/auth/logout, etc. then this should be set to /api/auth.
domain	string	The frontend domain used to generate the login payload. This domain should match the domain used on your auth backend.
secureStorage	ISecureStorage	Secure storage to use when working with JWT tokens. By default auth uses cookies so no need to set this unless you want to specifically use JWT tokens 
 
 
 authConfig={{
        authUrl: "/api/auth",
        domain: "https://example.com",




        Certainly! Here's the complete App.js sample file code with all the additional parameters and configurations:

jsx
Copy code
import { ThirdwebProvider } from "@thirdweb-dev/react";
import { Gnosis } from "@thirdweb-dev/chains"; // Import the chain you want to use

function MyApp() {
  return (
    <ThirdwebProvider
      activeChain={Gnosis} // Set the active chain to Gnosis
      clientId="your-client-id" // Replace with your client ID obtained from thirdweb dashboard
      authConfig={{
        authUrl: "/api/auth", // Configure authentication settings
        domain: "https://example.com",
      }}
      supportedWallets={[metamaskWallet(), coinbaseWallet(), walletConnect()]} // Define supported wallets
      supportedChains={[Ethereum, Polygon]} // Specify supported chains
      autoConnect={false} // Control autoconnect behavior
      dAppMeta={{
        name: "My App", // Set metadata for your app
        description: "My app description",
        logoUrl: "https://example.com/logo.png",
        url: "https://example.com",
        isDarkMode: true,
      }}
      sdkOptions={{
        readonlySettings: {
          rpcUrl: "<rpc-url>", // Override default SDK options
          chainId: 1,
        },
        gasSettings: {
          maxPriceInGwei: 123,
          speed: "fastest",
        },
        gasless: {
          openzeppelin: {
            relayerUrl: "<open-zeppelin-relayer-url>",
            relayerForwarderAddress: "<open-zeppelin-forwarder-address>",
          },
          biconomy: {
            apiId: "biconomy-api-id",
            apiKey: "biconomy-api-key",
            deadlineSeconds: 123,
          },
        },
        infuraApiKey: "<infura-api-key>",
        alchemyApiKey: "<alchemy-api-key>",
      }}
      storageInterface={storage} // Customize the storage interface
      queryClient={queryClient} // Pass your own QueryClient if using React Query
    >
      <YourApp />
    </ThirdwebProvider>
  );
}