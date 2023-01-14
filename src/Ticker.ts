import { WorldElm } from "./canvasElm/WorldElm";
import { JaPNaAEngine2d } from "./JaPNaAEngine2d";

export class Ticker {
    public static FIXED_TIME: number = 1 / 120;
    public static MAX_TICK_TIME_ELAPSED = 1 / 50;

    public timeElapsed = 0;

    private entities!: ReadonlyArray<WorldElm>;
    private leftOverFixed: number;
    private lastTime: number;

    constructor(private engine: JaPNaAEngine2d) {
        this.lastTime = performance.now();
        this.leftOverFixed = 0;
    }

    public resume(): void {
        this.lastTime = performance.now();
    }

    public tickAll(entities: ReadonlyArray<WorldElm>): void {
        const now = performance.now();
        const deltaTime = (now - this.lastTime) / 1000;
        let timeElapsed = deltaTime;
        this.lastTime = now;
        this.entities = entities;

        this.engine.world.removeMarkedElms();

        for (; timeElapsed > Ticker.MAX_TICK_TIME_ELAPSED; timeElapsed -= Ticker.MAX_TICK_TIME_ELAPSED) {
            this.tickByTime(Ticker.MAX_TICK_TIME_ELAPSED);
        }

        this.tickByTime(deltaTime);
    }

    private tickByTime(deltaTime: number) {
        this.timeElapsed = deltaTime;

        for (const entity of this.entities) {
            entity.tick();
        }
        this.engine.collisions._checkCollisions();

        this.timeElapsed = Ticker.FIXED_TIME;

        for (this.leftOverFixed += deltaTime; this.leftOverFixed >= Ticker.FIXED_TIME; this.leftOverFixed -= Ticker.FIXED_TIME) {
            for (const entity of this.entities) {
                if (entity.sleeping) { continue; }
                entity.fixedTick();
            }
            this.engine.collisions._checkCollisions();
        }

        this.engine.world.removeMarkedElms();
    }
}
