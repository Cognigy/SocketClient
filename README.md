# Description

This package is used to create a connection to a Cognigy socket-endpoint

# Usage

```javascript
const SocketClient = require('socket-client');

(async () => {
    // create a client instance with a socket url and an url token
    const client = new SocketClient('https://socket.url', 'socket-token');

    // register a handler for messages
    client.on('output', output => {
        console.log("Text: " + output.text + "   Data: " + output.data);
    });

    // establish a socket connection (returns a promise)
    await client.connect();
    
    // send a message with text, text and data, data only
    client.sendMessage('hello there');
    client.sendMessage('hello there', { color: 'green' });
    client.sendMessage('', { color: 'green' });
})()
```
