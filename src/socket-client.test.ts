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

	resolvePendingAck() {
		const ack = this.pendingAcks.shift();
		ack?.(null);
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
	it("does not re-buffer a message on disconnect-before-ack if no ack has ever been confirmed on this connection", () => {
		const fakeSocket = new FakeSocket();
		const client = createConnectedClient(fakeSocket);

		client.sendMessage("hello");
		expect(fakeSocket.sentProcessInputs.map(m => m.text)).toEqual(["hello"]);

		// Connection drops mid-flight, before the endpoint could
		// acknowledge receipt of "hello" - e.g. a backend rolling restart.
		// We have no positive evidence yet that this endpoint acks
		// "processInput" at all (no ack has ever succeeded on this
		// connection), so this is indistinguishable from an endpoint that
		// already received and processed "hello" but simply never acks -
		// re-buffering here would risk sending a duplicate. This matches
		// the pre-existing status quo for this scenario: no regression.
		fakeSocket.disconnect();

		const secondFakeSocket = reconnect(client);

		expect(secondFakeSocket.sentProcessInputs).toHaveLength(0);
	});

	it("re-buffers and resends a message on disconnect-before-ack once an earlier message on this connection has been confirmed acked", () => {
		const fakeSocket = new FakeSocket();
		const client = createConnectedClient(fakeSocket);

		// First message: let its ack succeed normally. This is positive
		// evidence that this endpoint does ack "processInput" messages.
		client.sendMessage("first");
		fakeSocket.resolvePendingAck();

		// Second message: connection drops before its ack arrives.
		client.sendMessage("second");
		fakeSocket.disconnect();

		const secondFakeSocket = reconnect(client);

		// Now that we know this endpoint acks messages, a disconnect
		// before the ack arrives can be safely re-buffered and resent -
		// if the endpoint had actually received "second", it would have
		// acked it just like it acked "first".
		expect(secondFakeSocket.sentProcessInputs.map(m => m.text)).toContain("second");
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

	it("resets hasConfirmedAck on reconnect, so an ack confirmed on a previous connection does not unlock re-buffering on a new one", () => {
		const fakeSocket = new FakeSocket();
		const client = createConnectedClient(fakeSocket);

		// Confirm an ack on connection #1, then let it end cleanly (nothing
		// in flight).
		client.sendMessage("first");
		fakeSocket.resolvePendingAck();
		fakeSocket.disconnect();

		const secondFakeSocket = reconnect(client);

		// Connection #2 has not yet had any message acked - e.g. it landed
		// on a different backend node after a rolling restart. A message
		// sent now and lost to a disconnect must NOT be re-buffered, even
		// though hasConfirmedAck was true on the previous connection: if it
		// had carried over, this is exactly the duplicate the gate exists
		// to prevent.
		client.sendMessage("second");
		secondFakeSocket.disconnect();

		const thirdFakeSocket = reconnect(client);

		expect(thirdFakeSocket.sentProcessInputs).toHaveLength(0);
	});

	it("re-buffers a message sent by flushMessageBuffer without losing it, even though the buffer is cleared right after the flush's send loop", () => {
		const fakeSocket = new FakeSocket();
		const client = createConnectedClient(fakeSocket);

		// Buffer two messages while offline.
		fakeSocket.disconnect();
		client.sendMessage("A");
		client.sendMessage("B");

		// Reconnecting flushes both "A" and "B" via the ack-emit path in one
		// synchronous pass, then immediately clears messageBuffer. Both
		// acks are still pending when that clear runs.
		const secondFakeSocket = reconnect(client);
		expect(secondFakeSocket.sentProcessInputs.map(m => m.text)).toEqual(["A", "B"]);

		// "A"'s ack succeeds - the first confirmed ack on this connection.
		secondFakeSocket.resolvePendingAck();

		// The connection drops before "B"'s ack arrives. That re-buffering
		// push necessarily happens after flushMessageBuffer's synchronous
		// send-then-clear already ran (ack callbacks are always
		// asynchronous), so it lands in the current buffer rather than
		// being wiped by a clear that already executed.
		secondFakeSocket.disconnect();

		const thirdFakeSocket = reconnect(client);
		expect(thirdFakeSocket.sentProcessInputs.map(m => m.text)).toContain("B");
	});
});

describe("SocketClient#switchSession", () => {
	function beginSwitchSession(client: SocketClient, nextFakeSocket: FakeSocket) {
		(io as jest.Mock).mockReturnValue(nextFakeSocket);
		const switchPromise = client.switchSession("next-session");
		nextFakeSocket.connect();
		nextFakeSocket.emit("endpoint-ready");
		return switchPromise;
	}

	it("does not leak a message buffered in the old session into the new session", async () => {
		const fakeSocket = new FakeSocket();
		const client = createConnectedClient(fakeSocket);

		fakeSocket.disconnect();
		client.sendMessage("leftover");

		const nextFakeSocket = new FakeSocket();
		await beginSwitchSession(client, nextFakeSocket);

		expect(nextFakeSocket.sentProcessInputs).toHaveLength(0);
	});

	it("tells the consumer which messages were discarded, instead of dropping them silently", async () => {
		const fakeSocket = new FakeSocket();
		const client = createConnectedClient(fakeSocket);

		fakeSocket.disconnect();
		client.sendMessage("leftover");

		const discarded = jest.fn();
		client.on("messagesDiscarded", discarded);

		const nextFakeSocket = new FakeSocket();
		await beginSwitchSession(client, nextFakeSocket);

		expect(discarded).toHaveBeenCalledWith({
			reason: "session-switched",
			messages: [{ text: "leftover", data: undefined }],
		});
	});

	it("stays quiet when there is nothing undelivered to report", async () => {
		const fakeSocket = new FakeSocket();
		const client = createConnectedClient(fakeSocket);

		const discarded = jest.fn();
		client.on("messagesDiscarded", discarded);

		const nextFakeSocket = new FakeSocket();
		await beginSwitchSession(client, nextFakeSocket);

		expect(discarded).not.toHaveBeenCalled();
	});
});
