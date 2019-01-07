export type TTypingStatus = "typingOn" | "typingOff";

export interface ITypingStatusPayload {
	status: TTypingStatus;
}