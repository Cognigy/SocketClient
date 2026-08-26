import { EventEmitter } from "events";

jest.mock("socket.io-client", () => ({ io: jest.fn() }));

import { io } from "socket.io-client";
import { SocketClient } from "./socket-client";

/**
 * Minimal stand-in for a socket.io-client `Socket`, covering just what
 * `SocketClient.connect()`/`sendMessage()` touch:
 *  - `.on`/`.once`/plain `.emit(event, ...)` behave like a normal
 *    EventEmitter, for driving "connect"/"endpoint-ready"/"disconnect".
 *  - `.emit("processInput", payload, ackCallback?)` is intercepted so
 *    tests can inspect what was sent and control whether/when the ack
 *    callback fires.
 *  - `.timeout(ms)` mirrors socket.io-client's real chainable API and
 *    returns `this`, so the following `.emit(...)` is still intercepted.
 *  - `.disconnect()` mirrors socket.io-client's real behavior of
 *    immediately failing any acks that are still pending when the
 *    connection drops, instead of waiting out their timeout.
 */
class FakeSocket extends EventEmitter {
	connected = false;
	sentProcessInputs: Array<{ text: string; data: any }> = [];
	private pendingAcks: Array<(err: Error | null) => void> = [];

	connect() {
		this.connected = true;
		this.emit("connect");
	}

	disconnect() {
		this.connected = false;
		const acks = this.pendingAcks;
		this.pendingAcks = [];
		this.emit("disconnect");
		acks.forEach(ack => ack(new Error("socket has been disconnected")));
	}

	timeout(_ms: number) {
		return this;
	}

	emit(event: string, ...args: any[]): boolean {
		if (event === "processInput") {
			const [payload, ackCallback] = args;
			this.sentProcessInputs.push({ text: payload.text, data: payload.data });
			if (typeof ackCallback === "function") {
				this.pendingAcks.push(ackCallback);
			}
			return true;
		}
		return super.emit(event, ...args);
	}

	timeoutPendingAck(err: Error) {
		const ack = this.pendingAcks.shift();
		ack?.(err);
	}
}

function createConnectedClient(fakeSocket: FakeSocket) {
	(io as jest.Mock).mockReturnValue(fakeSocket);
	const client = new SocketClient("https://example.cognigy.ai", "token", {
		reconnection: false, // tests drive reconnection manually and deterministically
	});
	client.connect();
	fakeSocket.connect();
	fakeSocket.emit("endpoint-ready");
	return client;
}

function reconnect(client: SocketClient): FakeSocket {
	const nextSocket = new FakeSocket();
	(io as jest.Mock).mockReturnValue(nextSocket);
	client.connect();
	nextSocket.connect();
	nextSocket.emit("endpoint-ready");
	return nextSocket;
}

describe("SocketClient", () => {
	it("starts out disconnected and not endpoint-ready", () => {
		const client = new SocketClient("https://example.cognigy.ai", "token");

		expect(client.connected).toBe(false);
		expect(client.isEndpointReady).toBe(false);
	});
});

describe("SocketClient#sendMessage", () => {
	it("re-buffers a message and resends it after reconnecting, if the connection drops before it is acknowledged", () => {
		const fakeSocket = new FakeSocket();
		const client = createConnectedClient(fakeSocket);

		client.sendMessage("hello");
		expect(fakeSocket.sentProcessInputs.map(m => m.text)).toEqual(["hello"]);

		// Connection drops mid-flight, before the endpoint could
		// acknowledge receipt of "hello" - e.g. a backend rolling restart.
		fakeSocket.disconnect();

		const secondFakeSocket = reconnect(client);

		// The message must be re-sent after reconnecting, not silently
		// dropped just because it looked "sent" before the drop.
		expect(secondFakeSocket.sentProcessInputs.map(m => m.text)).toContain("hello");
	});

	it("does not re-send a message if only the ack times out while the connection stays alive", () => {
		const fakeSocket = new FakeSocket();
		const client = createConnectedClient(fakeSocket);

		client.sendMessage("hello");
		expect(fakeSocket.sentProcessInputs.map(m => m.text)).toEqual(["hello"]);

		// The ack never arrives, but we never disconnected either - this
		// simulates an endpoint that doesn't ack "processInput" at all.
		fakeSocket.timeoutPendingAck(new Error("operation has timed out"));

		const secondFakeSocket = reconnect(client);

		// Nothing should be re-sent - the endpoint may already have
		// received and processed "hello"; re-sending would duplicate it.
		expect(secondFakeSocket.sentProcessInputs).toHaveLength(0);
	});

	it("falls back to a plain fire-and-forget emit when emitWithAck is disabled", () => {
		const fakeSocket = new FakeSocket();
		(io as jest.Mock).mockReturnValue(fakeSocket);
		const client = new SocketClient("https://example.cognigy.ai", "token", {
			reconnection: false,
			emitWithAck: false,
		});
		client.connect();
		fakeSocket.connect();
		fakeSocket.emit("endpoint-ready");

		const timeoutSpy = jest.spyOn(fakeSocket, "timeout");
		client.sendMessage("hello");

		expect(timeoutSpy).not.toHaveBeenCalled();
		expect(fakeSocket.sentProcessInputs.map(m => m.text)).toEqual(["hello"]);
	});
});
