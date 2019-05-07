export interface Options {
	/** User ID of the corresponding Contact Profile */
	userId: string;

	/* The current session for this user. Used to generate unique sessions for a user on each new "connect" */
	sessionId: string;

	/** The identifier of the channel on which the client runs */
	channel: string;

	reconnection: boolean;
	interval: number;
	expiresIn: number;

	resetState: boolean;
	resetContext: boolean;
	reloadFlow: boolean;
	resetFlow: boolean;

	passthroughIP?: string;

	/**
	 * Whether to force a websocket connection.
	 */
	forceWebsockets: boolean;
};