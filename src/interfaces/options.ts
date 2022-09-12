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

	enableInnerSocketHandshake: boolean;
};
