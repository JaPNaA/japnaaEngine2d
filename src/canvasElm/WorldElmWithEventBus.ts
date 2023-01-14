import { EventBus } from "../util/EventBus.js";
import { WorldElm } from "./WorldElm.js";

/**
 * WorldElm with a subscription management system (this.subscribe(...)) that
 * automatically removes subscriptions on removal.
 */
export abstract class WorldElmWithSubscriptions extends WorldElm {
    private subscriptionsList: [EventBus<any>, (data: any) => any][] = [];

    protected subscribe<T>(bus: EventBus<T>, handler: (data: T) => any) {
        const boundHandler = handler.bind(this);
        bus.subscribe(boundHandler);
        this.subscriptionsList.push([bus, boundHandler]);
    }

    protected unsubscribe<T>(fromBus: EventBus<T>) {
        let unsubscribed = false;
        for (let i = this.subscriptionsList.length - 1; i >= 0; i--) {
            const [bus, handler] = this.subscriptionsList[i];
            if (bus === fromBus) {
                fromBus.unsubscribe(handler);
                this.subscriptionsList.splice(i, 1);
                unsubscribed = true;
            }
        }
        if (!unsubscribed) {
            console.warn("Tried to unsubscribe from", fromBus, "but no matching subscription was found.");
        }
    }

    public remove() {
        super.remove();

        for (const [bus, handler] of this.subscriptionsList) {
            bus.unsubscribe(handler);
        }
    }
}
