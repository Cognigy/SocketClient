import { SocketClient } from "./socket-client";

describe("SocketClient", () => {
	it("starts out disconnected and not endpoint-ready", () => {
		const client = new SocketClient("https://example.cognigy.ai", "token");

		expect(client.connected).toBe(false);
		expect(client.isEndpointReady).toBe(false);
	});
});
