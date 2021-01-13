# @rbxts/net-eventemitter

[![NPM](https://nodei.co/npm/@rbxts/net-eventemitter.png)](https://npmjs.org/package/@rbxts/net-eventemitter)

Node.js-inspired event emitter class. Also typesafe.

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
Then create an emitter like so:
```ts
import { ServerNetworkEmitter as Emitter } from "@rbxts/net-eventemitter"
const Emitter = new EventEmitter(GameEvents);
```
where GameEvents is your event object.

To handle any wrong type arguments sent by players pass in a function of type ```(eventName: string, player: Player, args: unknown[]) => void``` to the constructor.

## Example
```ts
import { ServerNetworkEmitter as Emitter } from "@rbxts/eventemitter";

const Events = {
	playerDead: [t.string]
}

const invalidArgsHandler = (event, player, args) => {
	print(`Player ${player.Name} sent invalid arguments to event ${event}!`)
}

const Emitter = new EventEmitter(Events, invalidArgsHandler);

Emitter.emit("playerDead", "Mixu_78");
```
```ts
import { ClientNetworkEmitter as Emitter } from "@rbxts/eventemitter";

const Events = {
	playerDead: [t.string]
}

const Emitter = new EventEmitter(Events);

Emitter.on("playerDead", (player) => print(`${player} died!`))
```