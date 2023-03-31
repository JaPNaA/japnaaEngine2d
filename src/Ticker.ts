import { WorldElm } from "./canvasElm/WorldElm";
import { JaPNaAEngine2d, TickOptions } from "./JaPNaAEngine2d";

export class Ticker {
    public fixedTickTime: number = 1 / 120;
    public maxTickTimeElapsed = 1 / 50;

    public timeElapsed = 0;

    public timeBetweenFrames = 0;
    public timeSinceLastFrame: number;

    private entities!: ReadonlyArray<WorldElm>;
    private leftOverFixed: number;
    private lastTime: number;
    private now: number;
    private paused: boolean = false;
    private requestAnimationFrameId = -1;

    private tickByTime: (deltaTime: number) => void;

    constructor(private engine: JaPNaAEngine2d, private options: Required<TickOptions>) {
        this.lastTime = this.now = performance.now();
        this.timeSinceLastFrame = 0;
        this.leftOverFixed = 0;

        if (this.options.fixedTick) {
            this.fixedTickTime = this.options.fixedTick;
            if (this.options.collisionCheckEveryFixedTick) {
                this.tickByTime = this.tickByTime_fixed_collisionsEveryFixedTick;
            } else {
                this.tickByTime = this.tickByTime_fixed_collisionOnce;
            }
        } else {
            this.tickByTime = this.tickByTime_noFixed;
        }

        if (this.options.maxTickDeltaTime) {
            this.maxTickTimeElapsed = this.options.maxTickDeltaTime;
        }

        if (typeof this.options.fps === 'number') {
            this.timeBetweenFrames = 1000 / this.options.fps;
        }

        if (this.options.visiblityHiddenBehaviour === "pause") {
            document.addEventListener("visibilitychange", () => {
                if (document.visibilityState === "hidden") {
                    this.pause();
                } else {
                    this.resume();
                }
            });
        }

        this.entities = engine.world.getElms();
    }

    public pause() {
        this.paused = true;
        cancelAnimationFrame(this.requestAnimationFrameId);
    }

    public resume(): void {
        this.paused = false;
        this.lastTime = performance.now();
        this.startNormalTickLoopIfShould();
    }

    public startNormalTickLoopIfShould(): void {
        if (this.options.fps === 'none') { return; }
        cancelAnimationFrame(this.requestAnimationFrameId);
        this.requestAnimationFrameCallback(performance.now());
    }

    private requestAnimationFrameCallback(now: number) {
        // to avoid keeping track of another 'lastTime' for the frames
        this.timeSinceLastFrame += now - this.now;
        this.now = now;

        if (this.timeSinceLastFrame > this.timeBetweenFrames) {
            if (this.timeBetweenFrames > 0) {
                this.timeSinceLastFrame %= this.timeBetweenFrames;
            }

            this.engine._tickComponents();
            this.tickAll();
            this.engine.draw();
        } else {
            console.log("frame skip");
        }

        if (!this.paused) {
            this.requestAnimationFrameId = requestAnimationFrame(now => this.requestAnimationFrameCallback(now));
        }
    }

    private tickAll(): void {
        const deltaTime = (this.now - this.lastTime) / 1000;
        let timeElapsed = deltaTime;
        this.lastTime = this.now;

        if (timeElapsed > this.options.longDelayLength) {
            if (this.options.longDelayBehaviour === "skip") {
                this.timeElapsed = this.timeBetweenFrames || this.maxTickTimeElapsed || this.fixedTickTime || 0.1;
            } else if (this.options.longDelayBehaviour === "pause") {
                this.pause();
                return;
            }
            // else, this.options.longDelayBehaviour === "continue"
        }

        if (this.options.maxTickDeltaTime) {
            for (; timeElapsed > this.maxTickTimeElapsed; timeElapsed -= this.maxTickTimeElapsed) {
                this.tickByTime(this.maxTickTimeElapsed);
            }
        }

        this.tickByTime(timeElapsed);
    }

    private tickByTime_fixed_collisionsEveryFixedTick(deltaTime: number) {
        this.timeElapsed = deltaTime;

        if (this.options.normalTicks) {
            for (const entity of this.entities) {
                entity.tick();
            }
        }

        this.engine.collisions._checkCollisions();

        this.timeElapsed = this.fixedTickTime;

        for (this.leftOverFixed += deltaTime; this.leftOverFixed >= this.fixedTickTime; this.leftOverFixed -= this.fixedTickTime) {
            for (const entity of this.entities) {
                if (entity.sleeping) { continue; }
                entity.fixedTick();
            }
            this.engine.collisions._checkCollisions();
        }

        this.engine.world.removeMarkedElms();
    }

    private tickByTime_fixed_collisionOnce(deltaTime: number) {
        this.timeElapsed = deltaTime;

        if (this.options.normalTicks) {
            for (const entity of this.entities) {
                entity.tick();
            }
        }

        this.timeElapsed = this.fixedTickTime;

        for (this.leftOverFixed += deltaTime; this.leftOverFixed >= this.fixedTickTime; this.leftOverFixed -= this.fixedTickTime) {
            for (const entity of this.entities) {
                if (entity.sleeping) { continue; }
                entity.fixedTick();
            }
        }

        this.engine.world.removeMarkedElms();

        this.engine.collisions._checkCollisions();
    }

    private tickByTime_noFixed(deltaTime: number) {
        this.timeElapsed = deltaTime;

        if (this.options.normalTicks) {
            for (const entity of this.entities) {
                entity.tick();
            }
        }

        this.engine.world.removeMarkedElms();

        this.engine.collisions._checkCollisions();
    }
}
