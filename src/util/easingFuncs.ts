/**
 * Ported from https://gist.github.com/gre/1650294
 */

// no easing, no acceleration
export function easeLinear(t: number): number { return t };
// accelerating from zero velocity
export function easeInQuad(t: number): number { return t * t };
// decelerating to zero velocity
export function easeOutQuad(t: number): number { return t * (2 - t) };
// acceleration until halfway, then deceleration
export function easeInOutQuad(t: number): number { return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t };
// accelerating from zero velocity 
export function easeInCubic(t: number): number { return t * t * t };
// decelerating to zero velocity 
export function easeOutCubic(t: number): number { return (--t) * t * t + 1 };
// acceleration until halfway, then deceleration 
export function easeInOutCubic(t: number): number { return t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1 };
// accelerating from zero velocity 
export function easeInQuart(t: number): number { return t * t * t * t };
// decelerating to zero velocity 
export function easeOutQuart(t: number): number { return 1 - (--t) * t * t * t };
// acceleration until halfway, then deceleration
export function easeInOutQuart(t: number): number { return t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t };
// accelerating from zero velocity
export function easeInQuint(t: number): number { return t * t * t * t * t };
// decelerating to zero velocity
export function easeOutQuint(t: number): number { return 1 + (--t) * t * t * t * t };
// acceleration until halfway, then deceleration 
export function easeInOutQuint(t: number): number { return t < .5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t };

/**
 * Mine
 */

const TAU = Math.PI * 2;

export function easeSin(t: number): number { return Math.sin(t * TAU); };

export type EasingFunc = (progress: number) => number;

export class EaseAnimation {
    private easingFunc: EasingFunc;
    private step: number;

    private length: number;
    private intensity: number;
    private animationRepeats: boolean;

    constructor(easingFunc: EasingFunc, options: {
        length?: number,
        intensity?: number,
        repeat?: boolean
    }) {
        this.easingFunc = easingFunc;
        this.step = 0;
        this.length = options.length || 1;
        this.animationRepeats = options.repeat || false;
        this.intensity = options.intensity || 1;
    }

    public get(): number {
        return this.easingFunc(this.step / this.length) * this.intensity;
    }

    public stepBy(i: number): void {
        this.step += i;
        this.wrapAhead();
    }

    public stepBack(i: number): void {
        this.step -= i;
        this.wrapBack();
    }

    public setStep(i: number): void {
        this.step = i;
        this.wrap();
    }

    private wrap(): boolean {
        return this.wrapAhead() || this.wrapBack();
    }

    private wrapAhead(): boolean {
        if (this.step > this.length) {
            if (this.animationRepeats) {
                this.step %= this.length;
            } else {
                this.step = this.length;
            }

            return true;
        }

        return false;
    }

    private wrapBack(): boolean {
        if (this.step < 0) {
            if (this.animationRepeats) {
                this.step %= this.length;
                this.step += this.length;
            } else {
                this.step = 0;
            }

            return true;
        }

        return false;
    }
}
