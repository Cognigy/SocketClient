import { SocketClient } from "./socket-client";


(async () => {
    const client = new SocketClient('https://endpoint-trial.cognigy.ai', '5e51fcdc2c10fe4c5267c8a798a7134086f60b62998062af620ed73b096e25bd');
    
    console.log('before');
    await client.connect();
    console.log('after');

    

})();