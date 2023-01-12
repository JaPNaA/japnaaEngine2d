import { EventBus } from "./util/EventBus.js";

export class KeyboardInput {
    private keys: { [x: string]: boolean } = {};
    private eventBusses: { [x: string]: EventBus<KeyboardEvent> } = {};

    constructor() {
        this.keyupHandler = this.keyupHandler.bind(this);
        this.keydownHandler = this.keydownHandler.bind(this);
        addEventListener("keyup", this.keyupHandler);
        addEventListener("keydown", this.keydownHandler);
    }

    public _dispose() {
        removeEventListener("keyup", this.keyupHandler);
        removeEventListener("keydown", this.keydownHandler);
    }

    /**
     * Get or create an event bus that sends messages when the specified key(s) are pressed
     * @param key the key(s) you want an event bus for
     */
    public getKeydownBus(key: string | string[]): EventBus<KeyboardEvent> {
        if (Array.isArray(key)) {
            return this.getOrCreateSuperkeyKeydownBus(key);
        } else {
            return this.getOrCreateKeydownBus(key);
        }
    }

    /**
     * Checks if a key is being held down.
     * 
     * If multiple keys are supplied, returns true of any of the specified keys are pressed.
     */
    public isDown(keyCodes: string[]) {
        for (const code of keyCodes) {
            if (this.keys[code]) { return true; }
        }
        return false;
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
