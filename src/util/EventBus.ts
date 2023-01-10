import { removeElmFromArray } from "./removeElmFromArray";

type Handler<T> = (data: T) => void;

export class EventBus<T = void> {
    private handlers: (EventBus<T> | Handler<T>)[] = [];
    private onceHandlers: (EventBus<T> | Handler<T>)[] = [];
    private parentBuses: EventBus<T>[] = [];

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
            } else {
                onceHandler(data);
            }
        }
        this.onceHandlers.length = 0;

        for (let i = this.handlers.length - 1; i >= 0; i--) {
            const handler = this.handlers[i];
            if (handler instanceof EventBus) {
                handler.send(data);
            } else {
                handler(data);
            }
            if (this.stoppingPropagation) {
                this.stoppingPropagation = false;
                break;
            }
        }
    }

    public isEmpty() {
        return this.handlers.length === 0 && this.onceHandlers.length === 0;
    }

    public stopPropagationLocal() {
        this.stoppingPropagation = true;
    }

    /**
     * Stops propagation of any message being sent
     */
    public stopPropagation() {
        this.stoppingPropagation = true;
        for (const parentBus of this.parentBuses) {
            parentBus.stopPropagation();
        }
    }

    /**
     * Subscribe to an event
     * @param name Name of event
     * @param handler Event handler
     */
    public subscribe(handler: Handler<T> | EventBus<T>) {
        this.handlers.push(handler);
        if (handler instanceof EventBus) {
            handler.parentBuses.push(this);
        }
    }

    public unsubscribe(handler: Handler<T> | EventBus<T>) {
        removeElmFromArray(handler, this.handlers);
        if (handler instanceof EventBus) {
            removeElmFromArray(this, handler.parentBuses);
        }
    }

    public subscribeOnce(handler: Handler<T> | EventBus<T>) {
        this.onceHandlers.push(handler);
        if (handler instanceof EventBus) {
            handler.parentBuses.push(this);
        }
    }

    public promise(): Promise<T> {
        return new Promise(res => {
            this.onceHandlers.push(res);
        });
    }

    public _dispose() {
        for (const parentBus of this.parentBuses) {
            parentBus.unsubscribe(this);
        }
        for (const childBusses of this.handlers) {
            if (childBusses instanceof EventBus) {
                removeElmFromArray(this, childBusses.parentBuses);
            }
        }
    }
}
