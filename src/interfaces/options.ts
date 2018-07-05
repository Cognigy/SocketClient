import { CognigyError } from "./cognigyError";
import { IOutput } from "./output";
import { IFinalPing } from "./finalPing";

export interface Options {
	/** Base URL of Socket Endpoint */
	baseUrl: string;

	/** The URL Token of the specific Socket Endpoint configured in the Endpoint Editor */
	URLToken: string;
	/** User ID of the corresponding Contact Profile */
	userId: string;

	/* The current session for this user. Used to generate unique sessions for a user on each new "connect" */
	sessionId: string;

	/** The identifier of the channel on which the client runs */
	channel: string;

	keepMarkup?: boolean;

	reconnection?: boolean;
	interval?: number;
	expiresIn?: number;

	resetState?: boolean;
	resetContext?: boolean;
	reloadFlow?: boolean;
	resetFlow?: boolean;

	handleError?: (error: CognigyError) => void;
	handleException?: (error: CognigyError) => void;
	handleOutput?: (output: IOutput) => void;

	handleLogstep?: (data: any) => void;
	handleLogstepError?: (data: any) => void;
	handleLogflow?: (data: any) => void;

	handlePing?: (finalPing: IFinalPing) => void

	passthroughIP?: string;
};