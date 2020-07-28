export interface Options {
	/** User ID of the corresponding Contact Profile  */
	userId: string;
	/** The current session for this user. Used to generate unique sessions for a user on each new "connect" */
	sessionId: string;
	/** The identifier of the channel on which the client runs */
	channel: string;

	/** Prevents the client from attempting to reconnect in case the connection is lost */
	disableReconnect: boolean;
	/** Sets the interval time inbetween reconnection attempts */
	reconnectInterval: number;
	/** Sets a limit on the amount of reconnection attempts */
	reconnectLimit: number;

	/** Sets an inactivity treshold in miliseconds after which the connection is considered "expired" */
	expiryLimit: number;

	/** Enables a fallback to HTTP polling instead of websockets */
	enablePollingFallback: boolean;
};
