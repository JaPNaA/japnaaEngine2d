import { EventBus } from "./util/EventBus";

export class KeyboardInput {
    private keys: { [x: string]: boolean } = {};
    private eventBusses: { [x: string]: EventBus<KeyboardEvent> } = {};

    constructor() {
        this.keyupHandler = this.keyupHandler.bind(this);
        this.keydownHandler = this.keydownHandler.bind(this);
        console.log(this.keys);
    }

    public _startListen() {
        addEventListener("keyup", this.keyupHandler);
        addEventListener("keydown", this.keydownHandler);
    }

    public _stopListen() {
        removeEventListener("keyup", this.keyupHandler);
        removeEventListener("keydown", this.keydownHandler);
    }

    public getKeydownBus(key: string | string[]): EventBus<KeyboardEvent> {
        if (Array.isArray(key)) {
            return this.getOrCreateSuperkeyKeydownBus(key);
        } else {
            return this.getOrCreateKeydownBus(key);
        }
    }

    private getOrCreateSuperkeyKeydownBus(keys: string[]) {
        const superkey = keys.join(",");
        if (superkey in this.eventBusses) {
            return this.eventBusses[superkey];
        }

        const superbus = new EventBus<KeyboardEvent>();
        for (const key of keys) {
            const bus = this.getOrCreateKeydownBus(key);
            bus.subscribe(superbus);
        }
        this.eventBusses[superkey] = superbus;
        return superbus;
    }

    private getOrCreateKeydownBus(key: string) {
        const existing = this.eventBusses[key];
        if (existing) {
            return existing;
        } else {
            const newBus = new EventBus<KeyboardEvent>();
            this.eventBusses[key] = newBus;
            return newBus;
        }
    }

    public isDown(keyCodes: string[]) {
        for (const code of keyCodes) {
            if (this.keys[code]) { return true; }
        }
        return false;
    }

    private keyupHandler(event: KeyboardEvent) {
        this.keys[event.code] = false;
    }

    private keydownHandler(event: KeyboardEvent) {
        this.keys[event.code] = true;

        const eventBus = this.eventBusses[event.code];
        if (eventBus) {
            eventBus.send(event);
        }
    }
}
