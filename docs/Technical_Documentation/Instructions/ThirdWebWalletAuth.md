# Step-by-Step Guide: Auth for Web3-Native Authentication and Authorization

## Overview
In this step-by-step guide, we'll explore Auth, a system that enables web3-native authentication and authorization. Auth distinguishes itself by using web3 identity, web3 proof-of-identity, and web3 authority to create a self-custodied authentication flow for your applications. This guide will provide a detailed overview of how Auth works and what sets it apart.

### What are authentication and authorization?
- **Authentication**: The process of verifying the identity of a user.
- **Authorization**: The process of determining what a specific user is allowed to access and do within an application.

Authentication and authorization are crucial components of any web application, enabling user-specific data storage, manipulation, and access control.

### How does authentication work?
1. **User Request for Login**: The authentication process typically begins when a user sends a request to log in to an application. This request must include proof-of-identity, such as a username and password.

2. **Server Authentication**: The server verifies the proof-of-identity provided by the user, confirming their identity. This verification process is known as authentication.

3. **JWT Issuance**: To avoid repeated proof-of-identity submission, the server issues a signed JSON Web Token (JWT) to the user upon successful authentication. The JWT contains the user's identity.

4. **JWT Usage**: The user can send this JWT to the server in subsequent requests to access resources. Because the JWT is signed by the server, it can be quickly verified, and the user's identity is instantly recognized without re-authentication.

### What makes Auth unique?
Auth introduces three key factors that distinguish it and make it suitable for web3 applications:

1. **Identity**: Auth uses web3 identities. Instead of usernames or emails, users are identified by their wallet addresses, making identities universal across applications and associated with on-chain data.

2. **Proof-of-Identity**: In web3, users can prove ownership of an identity with digital signatures, eliminating the need for passwords. Auth implements patterns specified in standards like Sign-in with Ethereum (EIP4361) and Sign-in with Wallet (CAIP122).

3. **Authority**: Auth uses JWTs for server-side recognition of authenticated users. Unlike traditional web2 flows, Auth relies on web3 wallets to issue and verify JWT tokens, eliminating external dependencies on third-party services like auth0.

## Putting it all together
In summary, Auth's use of web3 identity, proof-of-identity, and authority enables a self-custodied, web3-native authentication flow for your applications. Users can securely log in with their wallets, allowing server-side access to on-chain identity data and bridging the gap between web2 and web3 applications.

![Auth Flow](how-auth-works-3)