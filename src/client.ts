import * as sio from "socket.io-client";
import * as fetch from "isomorphic-fetch";
import { Options } from "./interfaces/options";
import { Output } from "./interfaces/output";
import { IFinalPing } from "./interfaces/finalPing";

/**
 * Class that exposes methods to easily connect to the cognigy brain-server,
 * send events to the brain and received processed input-text.
 */
export class CognigyClient {
	private options: Options;
	private intervalId: any;
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

		if (options.keepMarkup === undefined)
			this.options.keepMarkup = false;

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
						.catch((err: any) => {
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

		return this.getToken(this.options.baseUrl, this.options.user, this.options.apikey, this.options.channel, this.options.token)
			.then((token: any) => {
				return this.establishSocketConnection(token);
			})
			.then((socket: any) => {
				let resetState: boolean = false;
				let resetContext: boolean = false;

				if (this.options.resetState !== null && this.options.resetState !== undefined && this.options.resetState === true)
					resetState = true;

				if (this.options.resetContext !== null && this.options.resetContext !== undefined && this.options.resetContext === true)
					resetContext = true;

				socket.emit("init", {
					flowId: this.options.flow,
					language: this.options.language,
					version: this.options.version,
					passthroughIP: this.options.passthroughIP,
					resetFlow: this.firstLoad,
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
	public resetState(): Promise<string> {
		if (!this.isConnected()) {
			console.error("[Client] Error resetting state. You are not connected to the brain-server.");
			return Promise.reject("[Client] Error resetting state. You are not connected to the brain-server.");
		}

		this.mySocket.emit("resetState", (currentState: string) => {
			return Promise.resolve(currentState);
		});
	}

	/**
	 * Convenience method to send a "resetContext" event.
	 */
	public resetContext(): Promise<any> {
		if (!this.isConnected()) {
			console.error("[Client] Error resetting context. You are not connected to the brain-server.");
			return Promise.reject("[Client] Error resetting contenxt. You are not connected to the brain-server.");
		}

		this.mySocket.emit("resetContext", (currentContext: any) => {
			return Promise.resolve(currentContext);
		});
	}

	/**
	 * Sends a message to the brain-server.
	 */
	public sendMessage(text: string, data: any): void {
		if (this.isConnected())
			this.mySocket.emit("input", {
				text: text,
				data: data
			});
		else
			throw new Error("Error sending message - we are not connected");
	}

	/**
	 * Directly registers event listener on the raw socket.io socket.
	 */
	public on(event: string, handler: any): void {
		if (this.isConnected())
			this.mySocket.on(event, handler);
		else
			throw new Error("Error within on - we are not connected");
	}

	/**
	 * Sends an arbitrary event to the brain-server using the underlying
	 * socket.io connection.
	 */
	public sendEvent(event: string, data: any): void {
		if (this.isConnected())
			this.mySocket.emit(event, data);
		else
			throw new Error("Error in sendEvent - we are not connected");
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

		this.mySocket.on("error", (error: any) => {
			this.options.handleError ? this.options.handleError(error) : console.log(error);
		});

		this.mySocket.on("exception", (error: any) => {
			this.options.handleException ? this.options.handleException(error) : console.log(error);
		});

		this.mySocket.on("output", (output: Output) => {
			if (!this.options.keepMarkup) {
				output.text = output.text.replace(/<[^>]*>/g, "");
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
}