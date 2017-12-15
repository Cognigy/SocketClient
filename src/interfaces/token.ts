export interface IToken {
	/* The channel where the token is used e.g. facebook */
	channel: string;

	/* The date (in milliseconds) where the token expires */
	exp: number;

	/* The date (in milliseconds) where the token was created */
	iat: number;

	/* The user id */
	id: string;

	/* The organisation id */
	organisation: string;

	/* The type of connection */
	type: "device" | "user";
}