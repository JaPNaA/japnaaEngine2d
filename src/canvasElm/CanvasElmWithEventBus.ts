import { EventBus } from "../EventBus";
import { CanvasElm } from "./CanvasElm";

export abstract class CanvasElmWithEventBus extends CanvasElm {
    public eventBus = new EventBus();

    public dispose() {
        super.dispose();
        this.eventBus._dispose();
    }
}
