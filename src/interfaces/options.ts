export interface Options {
	/** User ID of the corresponding Contact Profile  */
	userId: string;
	/** The current session for this user. Used to generate unique sessions for a user on each new "connect" */
	sessionId: string;
	/** The identifier of the channel on which the client runs */
	channel: string;

	/** Enables a fallback to HTTP polling instead of websockets */
	allowPolling: boolean;

	/** If `true`, prevents the client from attempting to reconnect in case the connection is lost */
	disableReconnect: boolean;
	/** Sets the interval time inbetween reconnection attempts in miliseconds */
	reconnectInterval: number;
	/** Limits the maximum number of reconnection attempts. `0` means no limit */
	reconnectLimit: number;
};
