import { removeElmFromArray } from "./removeElmFromArray.js";

type Handler<T> = (data: T) => void;

export class EventBus<T = void> {
    /**
     * Handlers may be other EventBusses, Handlers, or undefined.
     * 
     * A handler is undefined if it's been unsubscribed. undefined handlers
     * are removed after a send.
     */
    private handlers: (EventBus<T> | Handler<T> | undefined)[] = [];
    private onceHandlers: (EventBus<T> | Handler<T>)[] = [];
    private parentBuses: EventBus<T>[] = [];

    /**
     * If there are undefined in handlers.
     */
    private handlersDirty = false;

    private stoppingPropagation = false;

    /**
     * Sends a message along the event bus
     * @param name Name of event
     * @param data Additional data
     */
    public send(data: T) {
        this.stoppingPropagation = false;

        for (const onceHandler of this.onceHandlers) {
            if (onceHandler instanceof EventBus) {
                onceHandler.send(data);
            } else if (onceHandler !== undefined) {
                onceHandler(data);
            }
        }
        this.onceHandlers.length = 0;

        for (let i = this.handlers.length - 1; i >= 0; i--) {
            const handler = this.handlers[i];
            if (handler instanceof EventBus) {
                handler.send(data);
            } else if (handler !== undefined) {
                handler(data);
            }
            if (this.stoppingPropagation) {
                this.stoppingPropagation = false;
                break;
            }
        }

        if (this.handlersDirty) {
            this.cleanHandlers();
        }
    }

    /**
     * Removed undefined from handlers.
     */
    private cleanHandlers() {
        for (let i = this.handlers.length - 1; i >= 0; i--) {
            if (this.handlers[i] === undefined) {
                this.handlers.splice(i, 1);
            }
        }
        this.handlersDirty = false;
    }

    public isEmpty() {
        return this.handlers.length === 0 && this.onceHandlers.length === 0;
    }

    /**
     * Stops propagation of any message being sent in this event bus.
     */
    public stopPropagationLocal() {
        this.stoppingPropagation = true;
    }

    /**
     * Stops propagation of any message being sent in this event bus AND in parent event busses.
     */
    public stopPropagation() {
        this.stoppingPropagation = true;
        for (const parentBus of this.parentBuses) {
            parentBus.stopPropagation();
        }
    }

    /**
     * Subscribe to an event
     */
    public subscribe(handler: Handler<T> | EventBus<T>) {
        this.handlers.push(handler);
        if (handler instanceof EventBus) {
            handler.parentBuses.push(this);
        }
    }

    /**
     * Unsubscribe from an event
     */
    public unsubscribe(handler: Handler<T> | EventBus<T>) {
        const index = this.handlers.indexOf(handler);
        if (index < 0) { throw new Error("Cannot unsubscribe handler that's not subscribed"); }
        this.handlers[index] = undefined;
        this.handlersDirty = true;

        if (handler instanceof EventBus) {
            removeElmFromArray(this, handler.parentBuses);
        }
    }

    /**
     * Subscribe to an event only once
     */
    public subscribeOnce(handler: Handler<T> | EventBus<T>) {
        this.onceHandlers.push(handler);
        if (handler instanceof EventBus) {
            handler.parentBuses.push(this);
        }
    }

    /**
     * Get a promise that resolves when an event is sent
     */
    public promise(): Promise<T> {
        return new Promise(res => {
            this.onceHandlers.push(res);
        });
    }

    /**
     * Removes itself from parent EventBusses and child EventBusses.
     */
    public _dispose() {
        for (let i = this.parentBuses.length - 1; i >= 0; i--) {
            this.parentBuses[i].unsubscribe(this);
        }
        for (const childBusses of this.handlers) {
            if (childBusses instanceof EventBus) {
                removeElmFromArray(this, childBusses.parentBuses);
            }
        }
    }
}
