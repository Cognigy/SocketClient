import {CognigyClient, Option} from "@cognigy/cognigy-client";

const options : Option = {
    baseUrl: 'http://api.cognigy.com:3100',
    user: 'benni',
    apikey: 'testapikey',
    flow: 'flowtest',
    language: 'en-US',
    handleError: (error) => {
        if(error .type === "UnauthorizedError")
            console.log("Error you supplied wrong credentials");
        else
            console.log(error);
    },
    handleException: (error) => {
        if(error.type === 500) // internal server error
            console.log("Internal error: " + error);
        else if(error.type === 400) //supplied data is errorneous eg. flow does not exist
            console.log("Wrong Data error:" + error);
        else
            console.log("other unexpected error" + error)
    },
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