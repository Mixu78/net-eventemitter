///<reference types="@rbxts/testez/globals"/>

declare function afterEach(fn: (context: {}) => void): void;

import { ServerNetworkEmitter as Server, ClientNetworkEmitter as Client } from "..";
import { t } from "@rbxts/t";
import Spy from "./spy";

const events = {
	test: [t.number] as const,
	foo: [] as const,
};

//@ts-expect-error Changing private variables bad
Client._mock = true;

export = () => {
	let invalidArgsSpy = new Spy();
	let server = new Server(events);
	let client = new Client(events);
	afterEach(() => {
		server.Destroy();
		client.Destroy();

		invalidArgsSpy = new Spy();

		server = new Server(events, (...args: unknown[]) => invalidArgsSpy.value(...args));
		client = new Client(events);
	});

	describe("client + server", () => {
		it("should fire events from and to both sides properly", () => {
			const serverSpy = new Spy();
			const clientSpy = new Spy();

			server.on("foo", () => serverSpy.value());
			client.on("foo", () => clientSpy.value());

			client.fireServer("foo");
			server.fireClient("foo", game.GetService("Players").LocalPlayer);

			expect(serverSpy.callCount).to.equal(1);
			expect(clientSpy.callCount).to.equal(1);
		});

		it("should call the invalid argument callback when invalid arguments are passed", () => {
			server.on("test", () => {});
			client.fireServer("test", "hehe" as never);
			expect(invalidArgsSpy.callCount).to.equal(1);
		});

		it("should receive only correct arguments on server", () => {
			const spy = new Spy();
			server.on("test", (player, num) => {
				expect(num).to.be.a("number");
				spy.value();
			});

			client.fireServer("test", 1);
			client.fireServer("test", "not number" as never);

			expect(spy.callCount).to.be.equal(1);
		});

		it("should receive arguments on client", () => {
			const spy = new Spy();
			client.on("test", (num) => {
				expect(num).to.be.a("number");
				spy.value();
			});

			server.fireAllClients("test", 1);
			server.fireAllClients("test", 2);

			expect(spy.callCount).to.be.equal(2);
		});

		it("should work with many client side emitters", () => {
			const client2 = new Client(events);
			const spy1 = new Spy();
			const spy2 = new Spy();

			client.on("foo", () => spy1.value());
			client2.on("foo", () => spy2.value());
			server.fireAllClients("foo");

			expect(spy1.callCount).to.be.equal(1);
			expect(spy2.callCount).to.be.equal(1);
		});
	});
};
