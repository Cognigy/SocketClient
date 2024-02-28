export interface Options {
	/** User ID of the corresponding Contact Profile */
	userId: string;

	/* The current session for this user. Used to generate unique sessions for a user on each new "connect" */
	sessionId: string;

	/** The identifier of the channel on which the client runs */
	channel: string;

	reconnection: boolean;
	reconnectionLimit: number;
	interval: number;
	expiresIn: number;

	resetFlow: boolean;

	passthroughIP?: string;

	/** 
	 * Whether to force a websocket connection.
	 * Will win over "forcePolling" if both are set to true.
	 */
	forceWebsockets: boolean;

	/** Whether to only rely on HTTP polling */
	disableWebsockets: boolean;

	/** 
	 * If this is enabled, the session parameters
	 * (userId, sessionId, urlToken, testMode) will be transferred
	 * via a handshake through the socket rather than
	 * via query parameters.
	 */
	enableInnerSocketHandshake: boolean;

	/**
	 * If this is enabled, the testMode=true query parameter will be passed
	 * to socket connection. And Socket.io endpoint will accepts messages as
	 * test messages without increasing the billable conversation count.
	 */
	testMode: boolean;

	/**
	 * If this is enabled, this`emitWithAck` parameter with be passed to socket connection.
	 * And socket.io endpoint will emit messages with acknowledgement. This will be useful when event buffering feature is enabled
	 * and network goes of, in lack of "acknowledgement" back to socket endpoint, message delivery is considered to be failed.
	 * 
	 * This is enabled by default and only used when "event buffering feature is enabled".
	 */
	emitWithAck: boolean;
};
