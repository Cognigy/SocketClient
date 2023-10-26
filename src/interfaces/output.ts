import { IMessageData } from "./messageData";

export interface IProcessReplyPayload {
	type: "output" | "finalPing" | "error";
	data: IProcessOutputData;
}

export interface IProcessOutputData {
	// if 'type' is 'output'
	text?: string;
	data?: IMessageData;

	// if 'type' is 'finalPing'
	type?: "regular" | "cognigyStopFlow";

	// for other events
	[key: string]: any;
}

export interface IOutput {
	text?: string;
	data?: IMessageData;
}