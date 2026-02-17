# JaPNaAEngine2d

JaPNaAEngine 2d is a JavaScript/TypeScript engine library optimized for 2d games on the web.

It is very work-in-progress.

## Installation

I haven't made an NPM package, so the easiest way to include JaPNaAEngine2d is to download this repository and run `npm install path/to/japnaaEngine2d`.

You will need to compile before use. Compile the TypeScript at the root of this repository with `npx tsc`.

## Getting Started

Start by creating a JaPNaAEngine2d object.

```ts
import { JaPNaAEngine2d } from "japnaaengine2d";

const engine = new JaPNaAEngine2d();
```

To draw something on the canvas, you should create a `WorldElm`.

```ts
import { WorldElm } from "japnaaengine2d";

class Player extends WorldElm {
    // Implement drawRelative to draw after translating to the WorldElm's
    // rect position.
    //
    // You should only implement one of drawRelative or draw.
    public drawRelative() {
        const X = this.engine.canvas.X;
        X.fillStyle = "#f00";
        X.fillRect(0, 0, 100, 100);
    }
}
```

Then you can add the player to the world.

```ts
engine.world.addElm(new Player());
```

Try moving the player!

```ts
import { WorldElm } from "japnaaengine2d";

class Player extends WorldElm {
    public drawRelative() { /* [not changed] */ }

    public tick() {
        this.rect.x += this.engine.ticker.timeElapsed * 100;
    }
}
```

## Grouping

If you have a lot of objects that you'd like to add or remove at the same time, you probably want to create a `ParentWorldElm`.

`ParentWorldElm` contains an `addChild` method. You can call this method any time to add a child `WorldElm` (including other `ParentWorldElm`s).

```ts
export class MyScene extends ParentWorldElm {
    constructor() {
        super();
        this.addChild(new Grid());
        this.addChild(new Player());

        for (const enemy of MyScene.enemies) {
            this.addChild(enemy);
        }

        // ...
    }
}
```

Then, if you add `MyScene` and remove `MyScene`, all of your children will be added and removed at the same time. Their `remove` methods will also be called!

Note that after you remove any `WorldElm`, the element cannot be re-added (should be treated as disposed).

## Features

Some features not documented yet include:

- **Sizer**: The canvas is automatically sized, handling awkward iOS resize events and high devicePixelRatios automatically.
- **Camera**: You can move all of the elements in the world at the same time.
- **HTMLOverlay**: `engine.htmlOverlay` lets you add `Elm`s (HTML elements) to the canvas. The elements are automatically configured to move with the camera.
- **Collision**: The collision system allows you to detect collisions between any two WorldElms efficiently, including the cursor.
- **Prerender**: Render expensive elements once. Automatically handles high device pixel ratios.
- **Components**: Create common behaviours shared between world elements without the need for inheritance.
- **Subscriptions**: An event handling system that automatically unregisters subscriptions when elements are removed.
