import {CognigyError} from "./cognigyError";
import {Output} from "./output";
import {IFinalPing} from "./finalPing";

export interface Options {
	baseUrl: string;
	user: string;
	apikey: string;

	channel: string;

	keepMarkup?: boolean;

	flow: string;
	language: string;
	version?: number;

	reconnection?: boolean;
	interval?: number;
	expiresIn?: number;

	resetState?: boolean;
	resetContext?: boolean;
	resetFlow?: boolean;

	handleError?: (error: CognigyError) => void;
	handleException?: (error: CognigyError) => void;
	handleOutput?: (output: Output) => void;

	handleLogstep?: (data: any) => void;
	handleLogstepError?: (data: any) => void;
	handleLogflow?: (data: any) => void;
	
	handlePing?: (finalPing: IFinalPing) => void

	res?: any;
	passthroughIP?: string;
	token?: string;
};