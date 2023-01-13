import { EventBus } from "../util/EventBus.js";
import { CanvasElm } from "./CanvasElm.js";

export abstract class CanvasElmWithEventBus extends CanvasElm {
    public eventBus = new EventBus();

    public dispose() {
        super.dispose();
        this.eventBus._dispose();
    }
}
