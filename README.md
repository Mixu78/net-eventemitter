# @rbxts/net-eventemitter

[![NPM](https://nodei.co/npm/@rbxts/net-eventemitter.png)](https://npmjs.org/package/@rbxts/net-eventemitter)

[@rbxts/eventemitter](https://npmjs.org/package/@rbxts/eventemitter) but with 100% more RemoteEvents

## Installation
```npm i @rbxts/net-eventemitter```

## Usage
First make an object with ```eventName: readonly t.check<any>[]``` pairs, for example
```ts
import { t } from "@rbxts/t"
const GameEvents = {
	roundStart: [t.string, t.number] as const,
	roundEnd: [t.string] as const,
}
```
Then create an emitter on both sides like so:
```ts
import { ServerNetworkEmitter as Server } from "@rbxts/net-eventemitter";

const Emitter = new Server(GameEvents);
```
```ts
import { ClientNetworkEmitter as Client } from "@rbxts/net-eventemitter";

const Emitter = new Client(GameEvents);
```
where GameEvents is your event object.

To handle wrong arguments sent by players pass in a function of type ```(eventName: string, player: Player, args: unknown[]) => void``` to the server emitter constructor, this is not supported on the client side.

It is recommended to not have more than one server side emitter as this can lead to odd behaviour.
Having multiple client side emitters is fine though.

## Example
```ts
import { ServerNetworkEmitter as Server } from "@rbxts/net-eventemitter";

const events = {
	playerDead: [t.string],
}

const invalidArgsHandler = (event, player, args) => {
	print(`Player ${player.Name} sent invalid arguments to event ${event}!`);
}

const emitter = new Server(events, invalidArgsHandler);

emitter.emit("playerDead", "Mixu_78");
```
```ts
import { ClientNetworkEmitter as Client } from "@rbxts/net-eventemitter";

const events = {
	playerDead: [t.string],
}

const emitter = new Client(events);

emitter.on("playerDead", (player) => print(`${player} died!`));
```