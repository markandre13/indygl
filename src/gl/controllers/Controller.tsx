import { vec3 } from "gl-matrix"
import type { JSX } from "toad.jsx/jsx-runtime"

export class Controller {
    /**
     * deactivate controller
     */
    destructor() {}
    /**
     * 
     * @returns text shown when controller is active
     */
    info(): JSX.Element | undefined { 
        return undefined 
    }
    /**
     * 
     * @returns a center to rotate around
     */
    selectionCenter(): vec3 { return vec3.fromValues(0,0,0) }
    paint() {}

    keyup(_ev: KeyboardEvent): void {}
    keydown(_ev: KeyboardEvent): void {}
    pointerdown(_ev: PointerEvent): void {}
    pointermove(_ev: PointerEvent): void {}
    pointerup(_ev: PointerEvent): void {}
}