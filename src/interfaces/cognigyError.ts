export interface CognigyError extends Error {
	type?: number,
	code?: number,
	reference?: number
}