import { Players, RunService, ReplicatedStorage } from "@rbxts/services";
import { Janitor } from "@rbxts/janitor";

import { AddPlayerToFunction, EventKey, EventsRecord, INetworkServer, TupleToFunction, FolderName } from "./types";

export class ServerNetworkEmitter<Events extends EventsRecord<Events>> implements INetworkServer<Events> {
	private static eventFolder: Folder;
	private eventMap: Map<EventKey<Events>, RemoteEvent>;
	private connections: Map<EventKey<Events>, Map<Function, RBXScriptConnection>>;
	private janitor: Janitor;

	constructor(
		private events: Events,
		private invalidArgsCallback?: <E extends EventKey<Events>>(
			eventName: E,
			player: Player,
			args: unknown[],
		) => void,
	) {
		if (!RunService.IsServer()) throw "ServerEmitter cannot be used from the client";

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
		if (!ServerNetworkEmitter.eventFolder) {
			ServerNetworkEmitter.eventFolder = new Instance("Folder");
			ServerNetworkEmitter.eventFolder.Name = FolderName;
			ServerNetworkEmitter.eventFolder.Parent = ReplicatedStorage;
		}

		for (const [event] of pairs(events)) {
			this.getEvent(event as never);
		}
	}

	private getEvent<E extends EventKey<Events>>(eventName: E): RemoteEvent {
		if (!RunService.IsServer()) throw "ServerEmitter cannot be used from the client";

		const makeEvent = () => {
			const event = new Instance("RemoteEvent");
			event.Name = eventName;
			event.Parent = ServerNetworkEmitter.eventFolder;

			this.eventMap.set(eventName, event);
			this.janitor.Add(event);
			return event;
		};

		const event = this.eventMap.get(eventName) ?? makeEvent();

		this.eventMap.set(eventName, event);

		return event;
	}

	private typeCheck<E extends EventKey<Events>>(eventName: E, args: unknown[], player: Player): boolean {
		const checks = this.events[eventName];

		if (args.size() !== checks.size()) {
			this.invalidArgsCallback?.(eventName, player, args);
			return false;
		}

		for (let i = 0; i < checks.size(); i++) {
			const check = checks[i];
			if (!check(args[i])) {
				this.invalidArgsCallback?.(eventName, player, args);
				return false;
			}
		}
		return true;
	}

	on<E extends EventKey<Events>>(eventName: E, callback: AddPlayerToFunction<TupleToFunction<Events[E]>>): this {
		if (!this.connections.has(eventName)) {
			this.connections.set(eventName, new Map());
		}

		if (this.connections.get(eventName)!.has(callback)) throw "Callback already added";

		const event = this.getEvent(eventName);

		const connection = event.OnServerEvent.Connect((player, ...args) => {
			if (!this.typeCheck(eventName, args, player)) return;
			(callback as Callback)(player, ...args);
		});
		this.connections.get(eventName)!.set(callback, connection);
		this.janitor.Add(connection);

		return this;
	}
	once<E extends EventKey<Events>>(eventName: E, callback: AddPlayerToFunction<TupleToFunction<Events[E]>>): this {
		if (!this.connections.has(eventName)) {
			this.connections.set(eventName, new Map());
		}

		if (this.connections.get(eventName)!.has(callback)) throw "Callback already added";

		const event = this.getEvent(eventName);

		let connection: RBXScriptConnection;
		connection = event.OnServerEvent.Connect((player, ...args) => {
			if (!this.typeCheck(eventName, args, player)) return;

			(callback as Callback)(player, ...args);
			connection!.Disconnect();
			connection = undefined!;
		});
		this.janitor.Add(connection);

		return this;
	}
	off<E extends EventKey<Events>>(eventName: E, callback: AddPlayerToFunction<TupleToFunction<Events[E]>>): this {
		this.connections.get(eventName)?.get(callback)?.Disconnect();
		return this;
	}
	fireClient<E extends EventKey<Events>>(
		eventName: E,
		client: Player,
		...args: Parameters<TupleToFunction<Events[E]>>
	): this {
		const event = this.getEvent(eventName);

		event.FireClient(client, ...args);
		return this;
	}
	fireClients<E extends EventKey<Events>>(
		eventName: E,
		clients: Player[],
		...args: Parameters<TupleToFunction<Events[E]>>
	): this {
		const event = this.getEvent(eventName);

		for (const client of clients) {
			event.FireClient(client, ...args);
		}

		return this;
	}
	fireAllClients<E extends EventKey<Events>>(eventName: E, ...args: Parameters<TupleToFunction<Events[E]>>): this {
		const event = this.getEvent(eventName);

		event.FireAllClients(...args);

		return this;
	}
	fireAllClientsExcept<E extends EventKey<Events>>(
		eventName: E,
		exceptedClient: Player | Player[],
		...args: Parameters<TupleToFunction<Events[E]>>
	): this {
		const event = this.getEvent(eventName);

		if (typeIs(exceptedClient, "Instance")) {
			for (const [, player] of ipairs(Players.GetPlayers())) {
				if (player.UserId === exceptedClient.UserId) {
					continue;
				}

				event.FireClient(player, ...args);
			}
		} else {
			for (const [, player] of ipairs(Players.GetPlayers())) {
				let send = true;
				for (const client of exceptedClient) {
					if (player.UserId === client.UserId) send = false;
				}
				if (send) event.FireClient(player, ...args);
			}
		}

		return this;
	}

	Destroy() {
		this.janitor.Destroy();

		this.connections = undefined!;
		this.eventMap = undefined!;
		//@ts-expect-error ts doesn't like "this" being reassigned
		this = undefined!;
	}
}
