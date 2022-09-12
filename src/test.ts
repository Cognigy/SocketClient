import { SocketClient } from './socket-client';

(async () => {
    console.log('gonnegding');
    const client = new SocketClient('http://localhost:3000', 'some-token', {
        forceWebsockets: true,
        // enableInnerSocketHandshake: true
    });

    client.on('connect', () => { console.log('connected') });
    client.on('disconnect', () => { console.log('disconnected') });
    client.on('output', console.log.bind(console));

    await client.connect();

    client.sendMessage('adsf', { qwer: 'qwer' });
})();