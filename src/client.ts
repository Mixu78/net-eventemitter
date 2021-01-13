import { ReplicatedStorage, RunService } from "@rbxts/services";
import { Janitor } from "@rbxts/janitor";

import { EventKey, EventsRecord, INetworkClient, TupleToFunction, FolderName } from "./types";

export class ClientNetworkEmitter<Events extends EventsRecord<Events>> implements INetworkClient<Events> {
	private static _mock = false;
	private eventMap: Map<EventKey<Events>, RemoteEvent>;
	private connections: Map<EventKey<Events>, Map<Function, RBXScriptConnection>>;
	private janitor: Janitor;

	constructor(private events: Events) {
		if (RunService.IsServer() && !ClientNetworkEmitter._mock) throw "ClientEmitter cannot be used from the server";
		this.eventMap = new Map();
		this.connections = new Map();
		this.janitor = new Janitor();

		this.janitor.Add({
			Destroy: () => this.eventMap.clear(),
		});
		this.janitor.Add({
			Destroy: () => {
				this.connections.forEach((m) => m.clear());
				this.connections.clear();
			},
		});
	}

	private getEvent<E extends EventKey<Events>>(eventName: E): RemoteEvent {
		if (RunService.IsServer() && !ClientNetworkEmitter._mock) throw "ClientEmitter cannot be used from the server";

		const getEvent = () => {
			const folder = ReplicatedStorage.WaitForChild(FolderName, 2);
			if (!folder) throw "Server side emitter not created!";
			const event = folder.FindFirstChild(eventName) as RemoteEvent | undefined;
			if (!event) throw "Event not created on server side!";

			this.eventMap.set(eventName, event);
			return event;
		};

		const event = this.eventMap.get(eventName) ?? getEvent();

		return event;
	}
	on<E extends EventKey<Events>>(eventName: E, callback: TupleToFunction<Events[E]>): this {
		if (!this.connections.has(eventName)) {
			this.connections.set(eventName, new Map());
		}

		if (this.connections.get(eventName)!.has(callback)) throw "Callback already added";

		const event = this.getEvent(eventName);

		const connection = event.OnClientEvent.Connect(callback);
		this.connections.get(eventName)!.set(callback, connection);

		this.janitor.Add(connection);

		return this;
	}
	once<E extends EventKey<Events>>(eventName: E, callback: TupleToFunction<Events[E]>): this {
		if (!this.connections.has(eventName)) {
			this.connections.set(eventName, new Map());
		}

		if (this.connections.get(eventName)!.has(callback)) throw "Callback already added";

		const event = this.getEvent(eventName);

		let connection: RBXScriptConnection;
		connection = event.OnClientEvent.Connect((...args: unknown[]) => {
			(callback as Callback)(...args);
			connection!.Disconnect();
			connection = undefined!;
		});

		this.janitor.Add(connection);

		return this;
	}
	off<E extends EventKey<Events>>(eventName: E, callback: TupleToFunction<Events[E]>): this {
		this.connections.get(eventName)?.get(callback)?.Disconnect();

		return this;
	}
	fireServer<E extends EventKey<Events>>(eventName: E, ...args: Parameters<TupleToFunction<Events[E]>>): this {
		const event = this.getEvent(eventName);
		event.FireServer(...args);

		return this;
	}
	Destroy() {
		this.janitor.Destroy();

		this.connections = undefined!;
		this.eventMap = undefined!;
		//@ts-expect-error ts doesn't like "this" being reassigned :/
		this = undefined!;
	}
}
