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
	 * Governs acknowledgements in BOTH directions of the connection.
	 * Disabling this flag turns off both behaviors described below.
	 *
	 * - Server -> client: tells the endpoint that this client will ack
	 *   its outbound "output"/"finalPing" events. The endpoint uses this
	 *   to know whether to expect an ack, so it can consider delivery to
	 *   the client failed if one doesn't arrive in time.
	 *
	 * - Client -> server: `sendMessage` waits for the endpoint to
	 *   acknowledge each message before considering it delivered. If the
	 *   connection drops before the acknowledgement arrives - and this
	 *   endpoint has previously been confirmed to ack messages at all -
	 *   the message is re-buffered and resent on the next successful
	 *   reconnect, instead of being silently lost while the UI already
	 *   shows it as sent.
	 *
	 * Enabled by default.
	 */
	emitWithAck: boolean;
};
