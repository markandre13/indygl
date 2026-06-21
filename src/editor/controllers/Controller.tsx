import { vec3 } from "gl-matrix"
import type { JSX } from "toad.jsx/jsx-runtime"

export class Controller {
    /**
     * deactivate controller
     */
    destructor() { }

    /**
     * 
     * @returns text to be shown at the bottom of the app informing about keyboard short cuts
     */
    keyboardInfo(): JSX.Element | undefined {
        return undefined
    }

    private label?: HTMLElement

    /**
     * text to be shown as an overlay at the top, horizontally centered
     */
    setInfo(text: string | undefined) {
        if (text) {
            if (this.label === undefined) {
                const overlay = document.getElementById('overlay')!
                const info = <div class="op-info">
                    <div></div>
                </div> as HTMLElement
                this.label = info
                overlay.appendChild(info)
            }
            (this.label.children[0] as HTMLElement).innerText = text
        } else {
            if (this.label !== undefined) {
                this.label?.remove()
            }
        }
    }

    hideInfo() {
        if (this.label === undefined) {
            return
        }
        this.label?.remove()
    }
    showInfo() {
        if (this.label === undefined) {
            return
        }
        const overlay = document.getElementById('overlay')!
        overlay.appendChild(this.label)
    }

    /**
     * 
     * @returns a center to rotate around
     */
    selectionCenter(): vec3 { return vec3.fromValues(0, 0, 0) }
    paint() { }

    keyup(_ev: KeyboardEvent): void { }
    keydown(_ev: KeyboardEvent): void { }
    pointerdown(_ev: PointerEvent): void { }
    pointermove(_ev: PointerEvent): void { }
    pointerup(_ev: PointerEvent): void { }
}