import { EventEmitter } from "events";
import * as SocketIOClient from "socket.io-client";
import { v4 as uuid } from 'uuid';
import { Options } from "./interfaces/options";
import { IOutput } from "./interfaces/output";
import { IProcessReplyPayload } from "./interfaces/output";
import { Input } from "./interfaces/input";
import { IFinalPing } from "./interfaces/finalPing";
import { ITypingStatusPayload } from "./interfaces/typingStatus";


export class SocketClient extends EventEmitter {
    public socketUrl: string;
    public socketURLToken: string;
    public socketOptions: Options;

    private socket: SocketIOClient.Socket;
    private socketReconnectInterval: NodeJS.Timeout;

    private messageBuffer: Input[] = [];
    private lastUsed: number;



    private static createDefaultSocketOptions(): Options {
        return {
            channel: 'socket-client',
            userId: `user-${uuid()}`,
            sessionId: `session-${uuid()}`,

            // connection behaviour
            expiresIn: null,
            forceWebsockets: false,
            interval: 10000,
            passthroughIP: null,
            reconnection: true,

            // optional brain commands
            // TODO remove if possible
            reloadFlow: false,
            resetContext: false,
            resetFlow: false,
            resetState: false,
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

        this.updateLastUsed();
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
        this.socketReconnectInterval = setInterval(async () => {
            if (!this.connected) {
                console.log("[SocketClient] Trying to reconnect");

                try {
                    await this.connect();
                    console.log(`[SocketClient] Successfully reconnected.`);
                } catch (err) {
                    console.error(`[SocketClient] Failed to reconnect, error was: ${JSON.stringify(err)}`);
                };
            }
        }, this.socketOptions.interval);
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
        if (this.socketOptions.expiresIn === null)
            return false;

        return (Date.now() - this.lastUsed) > this.socketOptions.expiresIn;
    }



    public async connect(): Promise<any> {
        const socket = SocketIOClient.connect(this.socketUrl, {
            reconnection: false,
            upgrade: true,
            transports: this.socketOptions.forceWebsockets
                ? ["websocket"]
                : ["polling", "websocket"]
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
        // TODO fix, it's in output
        socket.on("finalPing", (finalPing: IFinalPing) => this.emit('finalPing', finalPing));

        // decide positive / negative outcome of output based on content
        socket.on("output", (reply: IProcessReplyPayload) => {
            if (reply && reply.type === "error") {
                return this.emit('error', reply.data.error);
            }

            if (reply && reply.type === "output") {
                let output: IOutput = reply.data;

                this.emit('output', output);
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
                if (this.socketOptions.reconnection)
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
            this.updateLastUsed();

            /* Send the processInput event to the endpoint */
            this.socket.emit("processInput", {
                URLToken: this.socketURLToken,
                userId: this.socketOptions.userId,
                sessionId: this.socketOptions.sessionId,
                channel: this.socketOptions.channel,
                source: "device",
                passthroughIP: this.socketOptions.passthroughIP,
                reloadFlow: !!this.socketOptions.reloadFlow,
                resetFlow: !!this.socketOptions.resetFlow,
                resetState: !!this.socketOptions.resetState,
                resetContext: !!this.socketOptions.resetContext,
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