# CognigyClient
Repo for the cognigy (server) client which can be used 
to connect to the cognigy brain from server applications.

## Installation
Get all dependencies and install them:
* npm i

## Build
The project is written in modern typescript. To transpile
the project down to javascript, simply run:
* npm run build

## Example
```javascript
import {CognigyClient, Option} from "@cognigy/cognigy-client";
 
const options : Option = {
    baseUrl: 'server-url',
    user: 'your-username',
    apikey: 'your-apikey',
    flow: 'name-of-your-flow',
    language: 'en-US',
    handleOutput: (output) => {
        console.log("in client Implementation handle output");
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
