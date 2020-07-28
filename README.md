# Cognigy Socket Client

This package is used to create a connection to Cognigy.AI via a Socket Endpoint.  
You can read about setting up a Socket Endpoint in [our platform documentation](https://docs.cognigy.com/docs/deploy-a-socket-endpoint)

## Installation
Install this module using the following `npm` command
```
npm install @cognigy/socket-client
```

## Usage

```javascript
const { SocketClient } = require('@cognigy/socket-client');

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

## Socket Events
You can subscribe to the following events from the `SocketClient`:

```javascript
client.on('finalPing', () => {
    console.log('bot is done processing a message');
});

```
| Name | Event Payload | Description |
| - | - | - |
| output | `{ text, data }` | fires on every incoming message from the bot
| typingStatus | `"on"` or `"off"` | fires when the typing indicator should show or hide
| finalPing | - | fires when the bot is done processing a message
| error | `{ message }` | fires when an error happened in the bot

## Options
You can pass a third argument to `SocketClient` to set additional options as follows:

```javascript
const client = new SocketClient('https://socket.url', 'socket-token', {
    userId: 'user1234'
});
```

| Name | Type | Default | Description '
| - | - | - | - |
| `userId` | string | random string | User ID of the corresponding Contact Profile
| `sessionId` | string | random string | The current session for this user. Used to generate unique sessions for a user on each new "connect"
| `channel` | string | `"socket-client"` | The identifier of the channel on which the client runs
| `allowPolling` | boolean | `false` | Enables a fallback to HTTP polling instead of websockets
| `disableReconnect` | boolean | `false` | If `true`, prevents the client from attempting to reconnect in case the connection is lost
| `reconnectInterval` | number | `10000` | Sets the interval time inbetween reconnection attempts in miliseconds
| `reconnectLimit` | number | `5` | Limits the maximum number of reconnection attempts. `0` means no limit

