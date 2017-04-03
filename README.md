# CognigyClient
Repo for the cognigy (server) client which can be used 
to connect to the cognigy brain from server applications.

## Installation
To install the cognigy client for your server project, use the following:
* npm i @cognigy/cognigy-client --save

## Example
You get you started quickly, simply copy-paste this sample code and adjust your
options where necessary.

```javascript
import {CognigyClient, Options} from "@cognigy/cognigy-client";
 
const options : Options = {
    baseUrl: 'server-address',
    user: 'your-username',
    apikey: 'your-apikey',
    flow: 'your-flow-name',
    language: 'en-US',
    handleOutput: (output) => {
        console.log("Text: " + output.text + "   Data: " + output.data);
    }
};
 
let client : CognigyClient = new CognigyClient(options);
client.connect()
    .then(() => {
        client.sendMessage("I like pizza", undefined);
    })
    .catch((error) => {
        console.log(error);
    });
```
