Creating new Dashboard integrations

When creating new integrations for the dashboard, there are three places to add code.

    A new message type in the @truffle/dashboard-message-bus package.
    Integration code in the React frontend in the @truffle/dashboard package.
    Integration code in the Truffle CLI - this can be a completely new package, or added to an existing package.

In general the Truffle CLI sends requests to the dashboard, which uses the provided information and sends a response back. But for more complex integrations it may be required for the dashboard to send requests to the Truffle CLI, or for the Truffle CLI to send information without expecting a response back. In those cases the code on either side of the integration should be updated accordingly.