export interface IProcessOutputPayload {
	type: "logStep" | "logStepError" | "output" | "finalPing" | "error";
	data: IProcessOutputData;
}

export interface IProcessOutputData {
	// if 'type' is 'output'
	text?: string;
	data?: { [key: string]: any };

	// if 'type' is 'finalPing'
	type?: "regular" | "cognigyStopFlow";

	// for other events
	[key: string]: any;
}