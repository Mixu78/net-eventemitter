///<reference types="@rbxts/testez/globals"/>

import { ServerNetworkEmitter as Server } from "..";
import { t } from "@rbxts/t";
import { ReplicatedStorage } from "@rbxts/services";
import { FolderName } from "../types";

const events = {
	test: [t.number] as const,
	foo: [] as const,
};

export = () => {
	it("should create all events on instatiation", () => {
		const emitter = new Server(events);
		const folder = ReplicatedStorage.FindFirstChild(FolderName);
		expect(folder).to.be.ok();
		expect(folder!.GetChildren().size()).to.never.equal(0);
		emitter.Destroy();
	});

	it("should connect callbacks properly", () => {
		const emitter = new Server(events);
		expect(emitter.on("foo", () => {})).to.equal(emitter);
		emitter.Destroy();
	});

	it("should fire properly", () => {
		const emitter = new Server(events);
		expect(emitter.fireAllClients("test", 1)).to.equal(emitter);
		emitter.Destroy();
	});
};
