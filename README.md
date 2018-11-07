# CognigyClient
Repo for the cognigy (server) client which can be used 
to connect to the Cognigy.AI platform from server applications written in Node.JS.

This client is only compatible with the ``3.X`` version of our product and will no longer work with the old ``2.X`` versions!

## Installation
To install the cognigy client for your server project, use the following:
```
npm i @cognigy/cognigy-client --save
```

## Usage
If you want to use the CognigyClient you have to create a **Socket Endpoint** on the **COGNIGY.AI** platform. For a detailed description of creating and configuring a Socket Endpoint see our [Documentation](https://docs.cognigy.com/docs/deploy-a-socket-endpoint).

### Requirements
You'll need two bits of information from our **COGNIGY.AI** platform to sucessfully connect to your configured Socket Endpoint:
- The Base URL of the Socket Endpoint
- The URL Token of the Socket Endpoint

You can find them on the **Endpoint Editor** page of your Socket Endpoint.

## Example
You get you started quickly, simply copy-paste this sample code and adjust your
options where necessary.

```typescript
import { CognigyClient, Options } from "@cognigy/cognigy-client";

const options : Options = {
    /** Required fields */
    baseUrl: 'server-address',
    URLToken: 'endpoint-url-token',
    userId: 'your-user-id',
    sessionId: 'unique-session-id',
    channel: 'channel-identifier',
    forceWebsockets: false,
    handleOutput: (output) => {
        console.log("Text: " + output.text + "   Data: " + output.data);
    },

    /** Optional fields */
    keepMarkup: true,
    reconnection: true,
    interval: 1000,
    expiresIn: 5000,
    passthroughIp: "127.0.0.1",
    handleError: (error: CognigyError) => { console.log(error); },
    handleException: (error: CognigyError) => { console.log(error); },
    handlePing: (finalPing: IFinalPing) => { console.log("On final ping"); }
};

const client: CognigyClient = new CognigyClient(options);
client.connect()
    .then(() => {
        client.sendMessage("I like pizza", { key: "value" });
    })
    .catch((error) => {
        console.error(error);
    });
``