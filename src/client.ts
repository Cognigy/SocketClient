import * as sio from "socket.io-client";
import * as fetch from "isomorphic-fetch";
import { Options } from "./interfaces/options";
import { Output } from "./interfaces/output";
import { Input } from "./interfaces/input";
import { IFinalPing } from "./interfaces/finalPing";
import { IToken } from "./interfaces/token";
import * as jwt from "jsonwebtoken";

/**
 * Class that exposes methods to easily connect to the cognigy CAI-server,
 * send events to the brain and received processed input-text.
 */
export class CognigyClient {
	protected options: Options;
	private intervalId: any;
	private mySocket: SocketIOClient.Socket;
	private res: any;
	private firstLoad: boolean;
	private lastUsed: number;
	private messageBuffer: Input[];
	public endSess: number;
	private token: any;

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
		this.res = (options.res) ? options.res : null;
		this.endSess = 0;
		this.firstLoad = true;
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
							console.log(`[Client] Successfully reconnected to the CAI-server.`);

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
							console.error(`[Client] Failed to reconnect to the CAIi-server, error was: ${JSON.stringify(err)}`);
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
	public connect(): Promise<any> {
		let currentToken: string;

		return this.getToken(this.options.baseUrl, this.options.user, this.options.apikey, this.options.channel, this.options.token)
			.then((token: any) => {
				this.token = token;
				return this.establishSocketConnection(token);
			})
			.then((socket: SocketIOClient.Socket) => {
				let resetState = false;
				let resetContext = false;
				let resetFlow = true;

				if (this.options.resetState !== null && this.options.resetState !== undefined && this.options.resetState === true)
					resetState = true;

				if (this.options.resetContext !== null && this.options.resetContext !== undefined && this.options.resetContext === true)
					resetContext = true;

				if (this.options.resetFlow !== null && this.options.resetFlow !== undefined && this.options.resetFlow === false)
					resetFlow = false;

				socket.emit("init", {
					flowId: this.options.flow,
					language: this.options.language,
					version: this.options.version,
					passthroughIP: this.options.passthroughIP,
					reloadFlow: (this.options.resetFlow !== undefined) ? this.options.resetFlow : this.firstLoad,
					resetFlow: resetFlow,
					resetState: resetState,
					resetContext: resetContext
				});

				this.firstLoad = false;

				return new Promise((resolve: Function, reject: Function) => {
					socket.on("initResponse", (data: any) => {
						console.log("Brain connection established");
						resolve();
					});

					socket.on("exception", (data: any) => {
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
	 *
	 * @param {string} newFlowId - The id of a new flow that should be loaded into the
	 * users brain on the CAI-server.
	 * @param {string} language - The language of the flow.
	 * @param {number} version - The version of the flow.
	 * @returns {Promise<any>} Resolved when the "resetFlow" event was emitted to the server.
	 * @memberOf CognigyClient
	 */
	public resetFlow(newFlowId: string, language: string, version: number): Promise<any> {
		return new Promise((resolve: Function, reject: Function) => {
			if (!this.isConnected()) {
				const error: string = `[Client] Error resetting flow. You are not connected to the CAI-server.`;
				console.error(error);
				return reject(error);
			}

			this.updateLastUsed();

			this.mySocket.emit("resetFlow", {
				id: newFlowId,
				language: language,
				version: version
			});

			resolve();
		});
	}

	/**
	 * Convenience method to send a "resetState" event.
	 *
	 * @returns {Promise<string>} Resolved with the state that was set for the users brain
	 * on the CAI-server.
	 * @memberOf CognigyClient
	 */
	public resetState(): Promise<string> {
		return new Promise((resolve, reject) => {
			if (!this.isConnected()) {
				const error: string = `[Client] Error resetting state. You are not connected to the CAI-server.`;
				console.error(error);
				return reject(error);
			}

			this.updateLastUsed();

			this.mySocket.emit("resetState", (currentState: string) => {
				resolve(currentState);
			});
		});
	}

	/**
	 * Convenience method to send a "resetContext" event.
	 *
	 * @returns {Promise<any>} Resolved with the new context that was set within the users brain
	 * on the CAI-server.
	 * @membmerOf CognigyClient
	 */
	public resetContext(): Promise<any> {
		return new Promise((resolve, reject) => {
			if (!this.isConnected()) {
				const error: string = `[Client] Error resetting context. You are not connected to the CAI-server.`;
				console.error(error);
				return reject(error);
			}

			this.updateLastUsed();

			this.mySocket.emit("resetContext", (currentContext: any) => {
				resolve(currentContext);
			});
		});
	}

	/**
	 * Convenience method to send a "injectContext" event.
	 * 
	 * @param context {any} Context object (should be valid JSON)
	 * @returns {Promise<any>} Resolved with the context that was injected into the users brain
	 * on the CAI-server.
	 * @memberOf CognigyClient
	 */
	public injectContext(context: any): Promise<any> {
		return new Promise((resolve, reject) => {
			if (!this.isConnected()) {
				const error: string = `[Client] Error injecting context. You are not connected to the CAI-server.`;
				console.error(error);
				return reject(error);
			}

			if (typeof context !== 'object') {
				// passed context is not a JSON object (or any object), trying to convert
				try {
					context = JSON.parse(context);
				} catch (err) {
					const error: string = `[Client] Error injecting context. The passed context is not JSON.`;
					console.error(error);
					return reject(error);
				}
			}

			this.updateLastUsed();

			this.mySocket.emit("injectContext", context, (newContext: any) => {
				resolve(newContext);
			});
		});
	}

	/**
	 * Convenience method to send a "injectState" event.
	 * 
	 * @param state {String} Name of the state
	 * @returns {Promise<string>} Resolved with the state that was injected into the users brain on the
	 * CAI-server.
	 * @memberOf CognigyClient
	 */
	public injectState(state: string): Promise<string> {
		return new Promise((resolve, reject) => {
			if (!this.isConnected()) {
				const error: string = `[Client] Error injecting state. You are not connected to the CAI-server.`;
				console.error(error);
				return reject(error);
			}

			if (typeof state !== 'string') {
				// passed state is not a string
				const error: string = `[Client] Error injecting state. The passed state is not a string.`;
				console.error(error);
				return reject(error);
			}

			this.updateLastUsed();

			this.mySocket.emit("injectState", state, (newState: string) => {
				resolve(newState);
			});
		});
	}

	/**
	 * Sends a message to the CAI-server.
	 *
	 * @param {string} text - The text of your message you want to send.
	 * @param {any} data - The data you want to send.
	 * @memberOf CognigyClient
	 */
	public sendMessage(text: string, data: any): void {
		if (this.isConnected()) {
			this.updateLastUsed();

			this.mySocket.emit("input", {
				text: text,
				data: data
			});
		} else {
			// we currently have no connection - could be the case that we lost connection
			// e.g. because of a server restart of the CAI-server. Buffer all incoming
			// messages - they will be send when the connection was re-established
			this.messageBuffer.push({ 
				text: text, 
				data: data 
			});

			console.log(`[Client] Unable to directly send your message since we are not connected to a CAI-server. Your message will be buffered and send later on.`);
		}
	}

	/**
	 * Directly registers event listener on the raw socket.io socket.
	 *
	 * @param {string} event - The name of the event to subscribe to.
	 * @param {any} handler - The handler function to execute when the
	 * event was triggered.
	 * @memberOf CognigyClient
	 */
	public on(event: string, handler: any): void {
		if (this.isConnected()) {
			this.updateLastUsed();

			this.mySocket.on(event, handler);
		} else
			console.log(`[Client] Unable to subscribe on socket.io-event. Currently not connected to a CAI-server.`);
	}

	/**
	 * Sends an arbitrary event to the CAI-server using the underlying
	 * socket.io connection.
	 *
	 * @param {string} event - The name of the event to send.
	 * @param {any} data - The data you want to send.
	 * @param {any} callback - An optional callback to can sepcify. It
	 * will get called when the remote endpoint finished processing your
	 * event and triggers it from the server side!
	 * @memberOf CognigyClient
	 */
	public sendEvent(event: string, data: any, callback?: any): void {
		if (this.isConnected()) {
			this.updateLastUsed();

			(callback) ? this.mySocket.emit(event, data, callback) : this.mySocket.emit(event, data);
		} else
			console.log(`[Client] Unable to send event. Currently not connected to a CAI-server.`);
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

	private establishSocketConnection(token: string): Promise<SocketIOClient.Socket> {
		this.mySocket = sio.connect(this.options.baseUrl, { "query": "token=" + token, "reconnection": false, "upgrade": false });

		this.mySocket.on("error", (error: any) => {
			this.options.handleError ? this.options.handleError(error) : console.log(error);
		});

		this.mySocket.on("exception", (error: any) => {
			this.options.handleException ? this.options.handleException(error) : console.log(error);
		});

		this.mySocket.on("output", (output: Output) => {
			if (!this.options.keepMarkup) {
				output.text = (output && output.text && typeof output.text === "string") ? output.text.replace(/<[^>]*>/g, "") : output.text;
			}

			this.options.handleOutput ? this.options.handleOutput(output) : console.log("Text: " + output.text + " Data: " + output.data);
		});

		this.mySocket.on("logStep", (data: any) => {
			this.options.handleLogstep ? this.options.handleLogstep(data) : null;
		});

		this.mySocket.on("logStepError", (data: any) => {
			this.options.handleLogstepError ? this.options.handleLogstepError(data) : null;
		});

		this.mySocket.on("logFlow", (data: any) => {
			this.options.handleLogflow ? this.options.handleLogflow(data) : null;
		});

		this.mySocket.on("finalPing", (finalPing: IFinalPing) => {
			this.options.handlePing ? this.options.handlePing(finalPing) : console.log("PING");
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
		});
	}

	private getToken(baseUrl: string, user: string, apikey: string, channel: string, token?: string): Promise<any> {
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
					channel: channel,
					apikey: apikey
				})
			})
				.then((resBody: any) => {
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
	
	/**
	 * This method retrieves the organisationId from the jwt token if it exists
	 * 
	 * @returns {string} Returns the organisation id
	 * @memberOf CognigyClient
	 */
	public getOrganisation(): string {
		const decodedToken = jwt.decode(this.token) as IToken;
		const { organisation } = decodedToken;

		return organisation;
	}

	/**
	 * This method retrieves the userId from the jwt token if it exists
	 * 
	 * @returns {string} Returns the user id
	 * @memberOf CognigyClient
	 */
	public getUser(): string {
		const decodedToken = jwt.decode(this.token) as IToken;
		const { id } = decodedToken;

		return id;
	}

	private updateLastUsed(): void {
		this.lastUsed = Date.now();
	}
}