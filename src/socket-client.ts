import { EventEmitter } from "events";
import * as SocketIOClient from "socket.io-client";
import { v4 as uuid } from 'uuid';
import { Options } from "./interfaces/options";
import { IOutput } from "./interfaces/output";
import { IProcessReplyPayload } from "./interfaces/output";
import { Input } from "./interfaces/input";
import { ITypingStatusPayload } from "./interfaces/typingStatus";

export class SocketClient extends EventEmitter {
    public socketUrl: string;
    public socketURLToken: string;
    public socketOptions: Options;

    private socket: SocketIOClient.Socket;
    private socketReconnectInterval: NodeJS.Timeout;
    private reconnectCounter: number;

    private messageBuffer: Input[] = [];
    private lastUsed: number;

    private static createDefaultSocketOptions(): Options {
        return {
            userId: `user-${uuid()}`,
            sessionId: `session-${uuid()}`,
            channel: 'socket-client',

            // connection behaviour
            disableReconnect: false,
            reconnectInterval: 10000,
            reconnectLimit: 5,
            
            expiryLimit: null,
            
            enablePollingFallback: false,
        }
    }

    private static completeSocketOptions(options: Partial<Options> = {}): Options {
        return {
            ...SocketClient.createDefaultSocketOptions(),
            ...options
        }
    }



    constructor(socketUrl: string, socketToken: string, options?: Partial<Options>) {
        super();

        this.socketUrl = socketUrl;
        this.socketURLToken = socketToken;
        this.socketOptions = SocketClient.completeSocketOptions(options);
        this.reconnectCounter = 0;

        this.updateLastUsed();
    }

    private resetReconnectionCounter() {
        this.reconnectCounter = 0;
    }

    private registerReconnectionAttempt(): void {
        this.reconnectCounter++;
        console.log("[SocketClient] Trying to reconnect");

        if (this.shouldStopReconnecting()) {
            console.log(`[SocketClient] Reconnection attempts limit reached. Giving up.`);
            this.emit("socket/error", { type: "RECONNECTION_LIMIT"});
        }

    }

    private shouldStopReconnecting(): boolean {
        const { reconnectLimit } = this.socketOptions;

        return (reconnectLimit !== 0) && (reconnectLimit <= this.reconnectCounter);
    }


    private flushMessageBuffer() {
        if (this.messageBuffer.length > 0) {
            if (this.connected) {
                console.log(`[SocketClient] Starting to send your buffered messages...`);
                for (let msg of this.messageBuffer) {
                    this.sendMessage(msg.text, msg.data);
                }

                console.log(`[SocketClient] Finished sending ${this.messageBuffer.length} buffered messages.`);
                this.messageBuffer = [];
            } else {
                console.log('[SocketClient] Could not send your buffered messages because we are not connected')
            }
        }
    }

    private setupReconnectInterval() {
        if (!this.socketReconnectInterval) {
            this.socketReconnectInterval = setInterval(async () => {
                if (!this.connected && !this.shouldStopReconnecting()) {
                    this.registerReconnectionAttempt();
                    try {
                        await this.connect();
                        console.log(`[SocketClient] Successfully reconnected.`);
                    } catch (err) {
                        console.error(`[SocketClient] Failed to reconnect, error was: ${JSON.stringify(err)}`);
                    };
                }
            }, this.socketOptions.reconnectInterval);
        }
    }

    private updateLastUsed() {
        this.lastUsed = Date.now();
    }



    get connected(): boolean {
        if (!this.socket)
            return false;

        return this.socket.connected;
    }

    get expired(): boolean {
        if (this.socketOptions.expiryLimit === null)
            return false;

        return (Date.now() - this.lastUsed) > this.socketOptions.expiryLimit;
    }



    public async connect(): Promise<any> {
        const parsedUrl = new URL(this.socketUrl);
        const path = parsedUrl.pathname && parsedUrl.pathname !== "/" ?
            parsedUrl.pathname + "/socket.io" : null;

        const socket = SocketIOClient.connect(parsedUrl.origin, {
            path,
            reconnection: false,
            upgrade: true,
            transports: this.socketOptions.enablePollingFallback
                ? ["polling", "websocket"]
                : ["websocket"]
        });

        // forward Socket.IO events
        [
            'connect',
            'connect_error',
            'connect_timeout',
            'error',
            'disconnect',
            'reconnect',
            'reconnect_attempt',
            'reconnecting',
            'reconnect_error',
            'reconnect_failed',
            'ping',
            'pong'
        ].forEach(eventName => {
            socket.on(eventName, e => {
                this.emit(`socket/${eventName}`, e)
            });
        });

        // pass through basic events
        socket.on("exception", (error: any) => this.emit('exception', error));
        socket.on("typingStatus", (payload: ITypingStatusPayload) => this.emit('typingStatus', payload));   

        // decide positive / negative outcome of output based on content
        socket.on("output", (reply: IProcessReplyPayload) => {
            if (reply && reply.type === "error") {
                return this.emit('error', reply.data.error);
            }

            if (reply && reply.type === "output") {
                let output: IOutput = reply.data;

                this.emit('output', output);
            }

            if (reply && reply.type === "finalPing") {
                this.emit('finalPing', reply.data)
            }
        });


        // return success based on connection status
        return new Promise((resolve, reject) => {
            socket.on("connect_error", () => reject(new Error("[SocketClient] Error connecting")));
            socket.on("connect_timeout", () => reject(new Error("[SocketClient] Error connecting")));

            socket.on("connect", () => {
                console.log("[SocketClient] connection established");
                this.socket = socket;

                this.flushMessageBuffer();

                // if configured, initialize automatic reconnect attempts
                if (!this.socketOptions.disableReconnect)
                    this.setupReconnectInterval();

                resolve(this);
            });
        });
    }

    public disconnect(): SocketClient {
        clearInterval(this.socketReconnectInterval);
        this.socketReconnectInterval = null;

        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }

        return this;
    }

    public sendMessage(text: string, data?: any): SocketClient {
        if (this.connected) {
            this.resetReconnectionCounter();
            this.updateLastUsed();

            /* Send the processInput event to the endpoint */
            this.socket.emit("processInput", {
                URLToken: this.socketURLToken,
                userId: this.socketOptions.userId,
                sessionId: this.socketOptions.sessionId,
                channel: this.socketOptions.channel,
                source: "device",
                text,
                data,
            });

        } else {
            // we currently have no connection - could be the case that we lost connection
            // e.g. because of a server restart of the AI-server. Buffer all incoming
            // messages - they will be send when the connection was re-established
            this.messageBuffer.push({
                text: text,
                data: data
            });

            console.log(`[SocketClient] Unable to directly send your message since we are not connected. Your message will be buffered and sent later on.`);
        }

        return this;
    }
}
