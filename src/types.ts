import { t } from "@rbxts/t";

export const FolderName = "NetworkEventEmitter";

//eslint-disable-next-line
export type AddPlayerToFunction<F extends (...args: any[]) => void> = (player: Player, ...args: Parameters<F>) => void;
export type EventKey<T> = Extract<keyof T, string>;
export type EventsRecord<E> = Record<EventKey<E>, readonly t.check<unknown>[]>;
/*eslint-disable */
export type TupleToFunction<F> = F extends infer T
	? (
			...args: { [K in keyof T]: K extends keyof Array<any> | "length" ? T[K] : t.static<T[K]> } extends infer A
				? A extends ReadonlyArray<any>
					? A
					: never
				: never
	  ) => void
	: never;
/*eslint-enable */

export interface IBaseServer<Events extends EventsRecord<Events> = never> {
	/**
	 * Add a function to be called when an event is fired
	 * @param eventName The name of the event
	 * @param callback The function to call when fired
	 */
	on<E extends EventKey<Events>>(
		eventName: E,
		callback: TupleToFunction<Events[E]> | AddPlayerToFunction<TupleToFunction<Events[E]>>,
	): this;

	/**
	 * Add a function to be called once when an event is fired
	 * @param eventName The name of the event
	 * @param callback The function to call when fired
	 */
	once<E extends EventKey<Events>>(
		eventName: E,
		callback: TupleToFunction<Events[E]> | AddPlayerToFunction<TupleToFunction<Events[E]>>,
	): this;

	/**
	 * Remove a function from being called on event
	 * @param eventName The name of the event
	 * @param callback The function to remove
	 */
	off<E extends EventKey<Events>>(
		eventName: E,
		callback: TupleToFunction<Events[E]> | AddPlayerToFunction<TupleToFunction<Events[E]>>,
	): this;

	/**
	 * Destroy the emitter, disconnecting all connections and deleting all remoteevents
	 */
	Destroy(): void;
}

export interface INetworkServer<Events extends EventsRecord<Events>> extends IBaseServer<Events> {
	/**
	 * Fire a single client
	 * @param eventName The name of the event
	 * @param client The client to fire to
	 * @param ...args The arguments to send to the client
	 */
	fireClient<E extends EventKey<Events>>(
		eventName: E,
		client: Player,
		...args: Parameters<TupleToFunction<Events[E]>>
	): this;
	/**
	 * Fire the specified clients
	 * @param eventName The name of the event
	 * @param clients An array of players to fire
	 * @param ...args The arguments to send to the clients
	 */
	fireClients<E extends EventKey<Events>>(
		eventName: E,
		clients: Player[],
		...args: Parameters<TupleToFunction<Events[E]>>
	): this;
	/**
	 * Fire all clients
	 * @param eventName The name of the event
	 * @param ...args The arguments to send to all clients
	 */
	fireAllClients<E extends EventKey<Events>>(eventName: E, ...args: Parameters<TupleToFunction<Events[E]>>): this;
	/**
	 * Fire all clients except for the specified client(s)
	 * @param eventName The name of the event
	 * @param exceptedClient The client(s) to not fire
	 * @param ...args The arguments to send to all other clients
	 */
	fireAllClientsExcept<E extends EventKey<Events>>(
		eventName: E,
		exceptedClient: Player | Player[],
		...args: Parameters<TupleToFunction<Events[E]>>
	): this;
}

export interface INetworkClient<Events extends EventsRecord<Events>> extends IBaseServer<Events> {
	/**
	 * Fire the server
	 * @param eventName The name of the event
	 * @param ...args The arguments to send to the server
	 */
	fireServer<E extends EventKey<Events>>(eventName: E, ...args: Parameters<TupleToFunction<Events[E]>>): this;
}
