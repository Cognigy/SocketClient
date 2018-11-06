import * as sio from "socket.io-client";
import { Options } from "./interfaces/options";
import { IOutput } from "./interfaces/output";
import { IProcessReplyPayload } from "./interfaces/output";
import { Input } from "./interfaces/input";
import { IFinalPing } from "./interfaces/finalPing";

/**
 * Class that exposes methods to easily connect to the cognigy CAI-server,
 * send events to the brain and received processed input-text.
 */
export class CognigyClient {
	protected options: Options;
	private intervalId: any;
	private mySocket: SocketIOClient.Socket;
	private lastUsed: number;
	private messageBuffer: Input[];
	public endSess: number;

	/**
	 * Creates an instance of the CognigyClient and initializes the auto-reconnect
	 * if configured. Auto-connects to the CAI-server if auto-reconnect is configured.
	 * 
	 * @param {Options} options - The options the cognigy client should be initialized with.
	 * @memberOf CognigyClient
	 */
	constructor(options: Options) {
		this.options = options;
		this.intervalId = null;
		this.mySocket = null;
		this.endSess = 0;
		this.messageBuffer = [];

		if (options.keepMarkup === undefined)
			this.options.keepMarkup = false;

		if (options.reconnection === undefined)
			this.options.reconnection = true;

		if (options.interval === undefined)
			this.options.interval = 10000;

		if (options.expiresIn === undefined)
			this.options.expiresIn = null;

		if (this.options.reconnection) {
			this.intervalId = setInterval(() => {
				if (!this.isConnected()) {
					console.log("CognigyClient trying to reconnect");

					return this.connect()
						.then(() => {
							console.log(`[Client] Successfully reconnected.`);

							if (this.messageBuffer.length > 0) {
								console.log(`[Client] Starting to send your buffered messages...`);

								for (let msg of this.messageBuffer) {
									this.sendMessage(msg.text, msg.data);
								}

								console.log(`[Client] Finished sending ${this.messageBuffer.length} buffered messages.`);
								this.messageBuffer = [];
							}
						})
						.catch((err: any) => {
							console.error(`[Client] Failed to reconnect, error was: ${JSON.stringify(err)}`);
						});
				}
			}, this.options.interval);
		}

		this.updateLastUsed();
	}

	/**
	 * Retrieves a token and then connects to the CAI-server via socket.io. This method will
	 * fire the "init" event.
	 *
	 * @returns {Promise<SocketIOClient.Socket>} Resolved with the socket.io socket connected
	 * to the CAI-server. The socket can be used to emit events and subscribe on them.
	 * @memberOf CognigyClient
	 */
	public async connect(): Promise<any> {
		try {
			await this.establishSocketConnection();

		} catch (error) {
			throw new Error(`[Client] Error within the 'connect' method: ${error}`);
		}
	}

	/**
	 * Sends a message to the realtime endpoint, which retrieves
	 * the configured endpoint and sends the message to AI.
	 *
	 * @param {string} text - The text of your message you want to send.
	 * @param {any} data - The data you want to send.
	 * @memberOf CognigyClient
	 */
	public sendMessage(text?: string, data?: any): void {
		if (this.isConnected()) {
			this.updateLastUsed();

			/* Send the processInput event to the endpoint */
			this.mySocket.emit("processInput", {
				URLToken: this.options.URLToken,
				userId: this.options.userId,
				sessionId: this.options.sessionId,
				source: "device",
				passthroughIP: this.options.passthroughIP,
				reloadFlow: !!this.options.reloadFlow,
				resetFlow: !!this.options.resetFlow,
				resetState: !!this.options.resetState,
				resetContext: !!this.options.resetContext,
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

			console.log(`[Client] Unable to directly send your message since we are not connected. Your message will be buffered and sent later on.`);
		}
	}

	/**
	 * Disconnects from the CAI-server and stops the auto-reconnect.
	 *
	 * @memberOf CognigyClient
	 */
	public disconnect(): void {
		clearInterval(this.intervalId);
		this.intervalId = null;

		if (this.mySocket) {
			this.mySocket.disconnect();
			this.mySocket = null;
		}
	}

	/**
	 * Checks whether the client has already established a connection to
	 * the CAI-server.
	 *
	 * @returns {boolean} True when currently connected to a CAI-server, false otherwise.
	 * @memberOf CognigyClient
	 */
	public isConnected(): boolean {
		return this.mySocket && this.mySocket.connected;
	}

	/**
	 * Checks whether this client is already expired. Used to express whether the
	 * client wasn't used for a long time.
	 *
	 * @returns {boolean} True in case the 'expiresIn' time already passed, false otherwise.
	 * @memberOf CognigyClient
	 */
	public isExpired(): boolean {
		if (this.options.expiresIn === null)
			return false;

		return (Date.now() - this.lastUsed) > this.options.expiresIn;
	}

	private establishSocketConnection(): Promise<SocketIOClient.Socket> {
		this.mySocket = sio.connect(this.options.baseUrl, {
			"reconnection": false,
			"upgrade": true,
			"transports": this.options.forceWebsockets ? ["websocket"] : ["polling", "websocket"]
		});

		this.mySocket.on("error", (error: any) => {
			this.options.handleError ? this.options.handleError(error) : console.log(error);
		});

		this.mySocket.on("exception", (error: any) => {
			this.options.handleException ? this.options.handleException(error) : console.log(error);
		});

		this.mySocket.on("output", (reply: IProcessReplyPayload) => {

			if (reply && reply.type === "error") {
				this.options.handleError ? this.options.handleError(reply.data.error) : console.log(reply.data.error.message);
				return;
			}

			if (reply && reply.type === "output") {
				let output: IOutput = reply.data;

				if (!this.options.keepMarkup) {
					output.text = (reply && output.text && typeof output.text === "string") ? output.text.replace(/<[^>]*>/g, "") : output.text;
				}

				this.options.handleOutput ? this.options.handleOutput(output) : console.log("Text: " + output.text + " Data: " + output.data);
			}
		});

		this.mySocket.on("finalPing", (finalPing: IFinalPing) => {
			this.options.handlePing ? this.options.handlePing(finalPing) : console.log("[Client] PING");
		});

		return new Promise((resolve: Function, reject: Function) => {
			this.mySocket.on("connect", () => {
				console.log("[Client] connection established");
				resolve(this.mySocket);
			});

			this.mySocket.on("connect_error", () => {
				reject(new Error("[Client] Error connecting"));
			});

			this.mySocket.on("connect_timeout", () => {
				reject(new Error("[Client] Error connecting"));
			});
		});
	}

	private updateLastUsed(): void {
		this.lastUsed = Date.now();
	}
}