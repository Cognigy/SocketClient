import * as sio from "socket.io-client";
import * as fetch from "isomorphic-fetch";
import {Options} from "./interfaces/options";
import {Output} from "./interfaces/output";

/**
 * Class that exposes methods to easily connect to the cognigy brain-server,
 * send events to the brain and received processed input-text.
 */
export class CognigyClient {
    private options: Options;
    private intervalId : any;
    private mySocket: SocketIOClient.Socket;
    private res: any;
    private retBuffer: any;
    public endSess: number;
    private firstLoad: boolean;

    /**
     * Creates an instance of the CognigyClient and initializes the auto-reconnect
     * if configured. Auto-connects to the brain-server if auto-reconnect is configured.
     */
    constructor(options: Options) {
        this.options = options;
        this.res = (options.res) ? options.res : null;
        this.retBuffer = [];
        this.endSess = 0;
        this.firstLoad = true;

        if (options.reconnection === undefined)
            this.options.reconnection = true;

        if (options.interval === undefined)
            this.options.interval = 10000;

        if (this.options.reconnection) {
            this.intervalId = setInterval(() => {
                if (!this.isConnected()) {
                    console.log("CognigyClient trying to reconnect");

                    return this.connect()
                        .then(() => {
                            console.log("reconnected");
                        })
                        .catch((err : any) => {
                            console.log("error reconnecting", err);
                        });
                }
            }, this.options.interval);
        }
    }

    /**
     * Retrieves a token and then connects to the brain-server via socket.io. This method will
     * fire the "init" event.
     */
    public connect(): Promise<SocketIOClient.Socket> {
        let currentToken: string;

        return this.getToken(this.options.baseUrl, this.options.user, this.options.apikey, this.options.token)
            .then((token : any) => {
                return this.establishSocketConnection(token);
            })
            .then((socket: any) => {
                let resetState: boolean = true;

                if(this.options.resetState !== null && this.options.resetState !== undefined)
                    resetState = this.options.resetState;

                socket.emit("init", {
                    flowId: this.options.flow,
                    language: this.options.language,
                    version: this.options.version,
                    passthroughIP: this.options.passthroughIP,
                    resetFlow: this.firstLoad,
                    resetState: resetState
                });

                this.firstLoad = false;

                return new Promise((resolve: Function, reject: Function) => {
                    socket.on("initResponse", (data : any) => {
                        console.log("Brain connection established");
                        resolve();
                    });

                    socket.on("exception", (data : any) => {
                        reject("Error in brain initialization");
                    });
                });
            })
            .catch((error: any) => {
                return Promise.reject("[Client] Error within the 'connect' method: " + error);
            });
    }

    /**
     * Convenience method to send a "resetFlow" event.
     */
    public resetFlow(newFlowId: string, language: string, version: number): void {
        if (this.isConnected())
            this.mySocket.emit("resetFlow", {
                id: newFlowId,
                language: language,
                version: version
            });
        else
            throw new Error("Error sending resetFlow event - we are not connected");
    }

    /**
     * Convenience method to send a "resetState" event.
     */
    public resetState(): void {
        if (this.isConnected())
            this.mySocket.emit("resetState");
        else
            throw new Error("Error sending resetState event - we are not connected");
    }

    /**
     * Sends a message to the brain-server.
     */
    public sendMessage(text: string, data: any): void {
        if (this.isConnected())
            this.mySocket.emit("input", {
                text : text,
                data: data
            });
        else
            throw new Error("Error sending message - we are not connected");
    }

    /**
     * Directly registers event listener on the raw socket.io socket.
     */
    public on(event: string, handler: any): void {
        this.mySocket.on(event, handler);
    }

    /**
     * Sends an arbitrary event to the brain-server using the underlying
     * socket.io connection.
     */
    public sendEvent(event: string, data: any): void {
        this.mySocket.emit(event, data);
    }

    /**
     * Disconnects from the brain-server and stops the auto-reconnect.
     */
    public disconnect(): void {
        clearInterval(this.intervalId);

        if (this.mySocket)
            this.mySocket.disconnect();
    }

    /**
     * Checks whether the client has already established a connection to
     * the brain-server.
     */
    public isConnected(): boolean {
        return this.mySocket && this.mySocket.connected;
    }

    private establishSocketConnection(token: string): Promise<SocketIOClient.Socket> {
        this.mySocket = sio.connect(this.options.baseUrl, { "query": "token=" + token, "reconnection": false, "upgrade": false });

        this.mySocket.on("error", (error : any) => {
            this.options.handleError ? this.options.handleError(error) : console.log(error);
        });

        this.mySocket.on("exception", (error: any) => {
            this.options.handleException ? this.options.handleException(error) : console.log(error);
        });

        this.mySocket.on("output", (output : Output) => {
            this.options.handleOutput ? this.options.handleOutput(output) : console.log("Text: " + output.text + " Data: " + output.data);
        });

        this.mySocket.on("logStep", (output: Output) => {
            this.options.handleLogstep ? this.options.handleLogstep(output) : null;
        });

        this.mySocket.on("logStepError", (output: Output) => {
            this.options.handleLogstepError ? this.options.handleLogstepError(output) : null;
        });

        this.mySocket.on("logFlow", (output: Output) => {
            this.options.handleLogflow ? this.options.handleLogflow(output) : null;
        });

        this.mySocket.on("finalPing", () => {
            this.options.handlePing ? this.options.handlePing() : console.log("PING");
        });

        return new Promise((resolve: Function, reject: Function) => {
            this.mySocket.on("connect", () => {
                resolve(this.mySocket);
            });

            this.mySocket.on("connect_error", () => {
                reject(new Error("Error connecting"));
            });

            this.mySocket.on("connect_timeout", () => {
                reject(new Error("Error connecting"));
            });
        })
    }

    private getToken(baseUrl: string, user: string, apikey: string, token?: string): Promise<any> {
        if (token)
            return Promise.resolve(token);
        else
            return fetch(baseUrl + "/loginDevice", {
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                method: "POST",
                body: JSON.stringify({
                    user: user,
                    apikey: apikey
                })
            })
                .then((resBody : any) => {
                    if (resBody.status === 200) {
                        return resBody.json();
                    } else {
                        this.disconnect();
                        throw new Error(resBody.statusText + ": " + resBody.status);
                    }
                })
                .then((response: any) => {
                    if (response.token)
                        return Promise.resolve(response.token);
                    else
                        return Promise.reject(new Error("Unexptected error since no token was supplied as part of the response."));
                });
    }
}