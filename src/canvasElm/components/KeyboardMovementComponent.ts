import { WorldElmComponent } from "../WorldElmWithComponents.js";

export class KeyboardMovementComponent extends WorldElmComponent {
    tick() {
        let vx = 0, vy = 0;
        if (this.engine.keyboard.isDown(['ArrowUp', 'KeyW'])) {
            vy--;
        }
        if (this.engine.keyboard.isDown(['ArrowDown', 'KeyS'])) {
            vy++;
        }
        if (this.engine.keyboard.isDown(['ArrowLeft', 'KeyA'])) {
            vx--;
        }
        if (this.engine.keyboard.isDown(['ArrowRight', 'KeyD'])) {
            vx++;
        }
        if (vx && vy) { vx *= Math.SQRT1_2; vy *= Math.SQRT1_2; }
        this.parent.rect.x += vx * 800 * this.engine.ticker.timeElapsed;
        this.parent.rect.y += vy * 800 * this.engine.ticker.timeElapsed;
    }
}
