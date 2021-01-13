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
	on<E extends EventKey<Events>>(
		eventName: E,
		callback: TupleToFunction<Events[E]> | AddPlayerToFunction<TupleToFunction<Events[E]>>,
	): this;

	once<E extends EventKey<Events>>(
		eventName: E,
		callback: TupleToFunction<Events[E]> | AddPlayerToFunction<TupleToFunction<Events[E]>>,
	): this;

	off<E extends EventKey<Events>>(
		eventName: E,
		callback: TupleToFunction<Events[E]> | AddPlayerToFunction<TupleToFunction<Events[E]>>,
	): this;

	Destroy(): void;
}

export interface INetworkServer<Events extends EventsRecord<Events>> extends IBaseServer<Events> {
	fireClient<E extends EventKey<Events>>(
		eventName: E,
		client: Player,
		...args: Parameters<TupleToFunction<Events[E]>>
	): this;
	fireAllClients<E extends EventKey<Events>>(eventName: E, ...args: Parameters<TupleToFunction<Events[E]>>): this;
}

export interface INetworkClient<Events extends EventsRecord<Events>> extends IBaseServer<Events> {
	fireServer<E extends EventKey<Events>>(eventName: E, ...args: Parameters<TupleToFunction<Events[E]>>): this;
}
