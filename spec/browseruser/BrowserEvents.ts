import { code2keyAndLocation } from "./code2keyAndLocation"

type WhitespaceKeyCode = "Enter" | "NumpadEnter" | "Tab" | "Space"
type NavigationKeyCode = "ArrowDown" | "ArrowLeft" | "ArrowRight" | "ArrowUp" | "End" | "Home" | "PageDown" | "PageUp"
type EditingKeys = "Backspace" | "Clear" | "Copy" | "CrSel" | "Cut" | "Delete" | "EraseEof" | "ExSel" | "Insert" | "Paste" | "Redo" | "Undo"
type UIKeys = "Accept" | "Again" | "Attn" | "Cancel" | "ContextMenu" | "Escape" | "Execute" | "Find" | "Finish" | "Help" | "Pause" | "Play" | "Props" | "Select" | "ZoomIn" | "ZoomOut"
type ModifierKeyCode = "Dead" | "ShiftLeft" | "ShiftRight" | "ControlLeft" | "ControlRight" | "AltLeft" | "AltRight" | "MetaLeft" | "MetaRight"

type Alpha = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z"
type Numeric = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

type AlphaKeyCode = `Key${Alpha}`
type NumericKeyCode = `Digit${Numeric}` | `Numpad${Numeric}`

export type KeyCode = WhitespaceKeyCode | NavigationKeyCode | EditingKeys | UIKeys | ModifierKeyCode | AlphaKeyCode | NumericKeyCode

const LMB = 0
const MMB = 1
const RMB = 2

export interface KeyOptions {
    isComposing?: boolean,
    repeat?: boolean
    detail?: number
}

export interface Point {
    x: number
    y: number
}

// User / Browser: API to restrict EventGenerator to 
// EventGenerator: API to reduce dispatchEvent() to browser like events

// BrowserUser  : user interactions with browser
// BrowserEvents: create browser like events via dispatchEvent()

/**
 * class to emulate a user interacting with the browser
 *
 * * methods are designed to resemble user perspective
 * * keeps track of state between events, e.g. shift key, pointer position, ...
 */
export class BrowserEvent {
    /**
     * client (viewport) coordinates
     */
    pos: Point = { x: 0, y: 0 }

    /**
     * screen := pos + screenDelta
     */
    screenDelta?: Point

    /**
     * current element at pointer position
     */
    target: EventTarget | null = null

    // toggled by keyup and down
    protected shift = false
    protected ctrl = false
    protected alt = false
    protected meta = false// macOS: command key, windows: windows key

    protected downIn: EventTarget | null = null
    protected button: number | null = null;
    protected buttons = 0;

    //            number
    //            | mask
    // LMB button 0 1
    // MMB button 1 4
    // RMB button 2 2

    pointerDown(button: number, detail = 1) {
        this.button = button
        switch (button) {
            case LMB: this.buttons |= 1; break
            case MMB: this.buttons |= 4; break
            case RMB: this.buttons |= 2; break
        }
        this.dispatchPointerEvent("pointerdown", { button, pressure: 0.5, detail })
        this.downIn = this.target
    }
    // button may have been gone down while outside the window
    pointerUp(detail = 1, button = this.button) {
        this.button = button
        if (this.button === null) { throw Error("no button down") }
        switch (this.button) {
            case LMB: this.buttons &= 0xfe; break
            case MMB: this.buttons &= 0xfb; break
            case RMB: this.buttons &= 0xfd; break
        }
        this.dispatchPointerEvent("pointerup", { button: this.button, detail })
        this.button = null
    }

    // when a button is already pressed and another button is pressed, this won't create another
    // pointerdown event. instead further messages like pointermove will adjust the button's flag.
    // for now i am not going to implement it: too much effort for little value.
    pointerMove(x: number, y: number) {
        // console.log(`move: button=${this.button}, buttons=${this.buttons}`)
        this.pos.x = x
        this.pos.y = y
        this.dispatchPointerEvent("pointermove", {
            pressure: this.buttons ? 0.5 : 0
        })
    }
    pointerOver() {
        this.dispatchPointerEvent("pointerover")
    }
    // enter comes before move, hence the coordinates
    // buttons may have changed state while outside the window
    // relatedTarget is the window we are leaving
    pointerEnter(x: number, y: number, relatedTarget: EventTarget | null, buttons?: number) {
        this.pos.x = x
        this.pos.y = y
        if (buttons !== undefined) {
            this.buttons = buttons
        }
        this.dispatchPointerEvent("pointerenter", {
            relatedTarget,
            bubbles: false, cancelable: false, composed: false
        })
    }
    // leave comes after pointer has left the window, so there's no move to provide the coordinates
    // relatedTarget is the window we are entering
    pointerLeave(x: number, y: number, relatedTarget: EventTarget | null) {
        this.pos.x = x
        this.pos.y = y
        this.dispatchPointerEvent("pointerleave", {
            relatedTarget,
            pressure: this.buttons ? 0.5 : 0,
            bubbles: false, cancelable: false, composed: false
        })
    }
    click(detail = 1) {
        this.dispatchPointerEvent("click", {
            button: 0, detail
        })
    }

    // may arrive before mousemove, hence x and y
    wheel(props: {
        // WheelEvent.(DOM_DELTA_PIXEL|DOM_DELTA_LINE|DOM_DELTA_PAGE)
        deltaMode?: number,
        deltaX?: number,
        deltaY?: number,
        deltaZ?: number,
        // event may arrive before mousemove, hence x and y
        x?: number,
        y?: number
    }) {
        if (props.x !== undefined) { this.pos.x = props.x }
        if (props.y !== undefined) { this.pos.y = props.y }

        this.target = document.elementFromPoint(this.pos.x, this.pos.y)
        if (!this.target) { throw Error("NO TARGET ") }

        let clientX = this.pos.x, clientY = this.pos.y,
            screenX = this.pos.x + (this.screenDelta?.x ?? 0),
            screenY = this.pos.y + (this.screenDelta?.y ?? 0)

        this.target.dispatchEvent(new WheelEvent("wheel", {
            clientX, clientY, screenX, screenY,

            deltaMode: props.deltaMode ?? WheelEvent.DOM_DELTA_PIXEL,
            deltaX: props.deltaX ?? 0,
            deltaY: props.deltaY ?? 0,
            deltaZ: props.deltaZ ?? 0,

            ctrlKey: this.ctrl,
            shiftKey: this.shift,
            altKey: this.alt,
            metaKey: this.meta,

            view: window,
            bubbles: true,
            cancelable: true,
            composed: true
        }))
    }
    
    // no need for mouse yet, let's work with the code as is before putting effort into it
    keyUp(code: KeyCode, opt?: KeyOptions): void { this.keyUpOrDown("keyup", code, opt) }
    keyDown(code: KeyCode, opt?: KeyOptions): void { this.keyUpOrDown("keydown", code, opt) }

    focus(relatedTarget: EventTarget | null) {
        if (!this.target) { throw Error("NO TARGET ") }
        this.target.dispatchEvent(new FocusEvent("focus", {
            relatedTarget,

            view: window,
            bubbles: false,
            cancelable: false,
            composed: true
        }))
    }
    blur(relatedTarget: EventTarget | null) {
        if (!this.target) { throw Error("NO TARGET ") }
        this.target.dispatchEvent(new FocusEvent("blur", {
            relatedTarget,

            view: window,
            bubbles: false,
            cancelable: false,
            composed: true
        }))
    }

    protected keyUpOrDown(type: "keyup" | "keydown", code: KeyCode, opt?: KeyOptions): void {
        // workaround for missing Keyboard.getLayoutMap(), assuming international english keyboard
        this.setDeadKey(code, type === "keydown")

        const keyAndLoc = code2keyAndLocation(code, this.shift)
        if (!keyAndLoc) {
            console.log(`MISSING: code=${code}`)
            return
        }

        // const keyValue = this.keyCode2keyValue(keycode)

        const active = getActiveElement()
        if (!active) {
            console.log('no active element to deliver key event to')
        }


        active?.dispatchEvent(new KeyboardEvent(type, {
            //
            // KeyboardEventInit
            //
            code: code,
            isComposing: opt?.isComposing ?? false,
            key: keyAndLoc.key,
            location: keyAndLoc.loc,
            repeat: opt?.repeat ?? false,

            altKey: this.alt,
            shiftKey: this.shift,
            ctrlKey: this.ctrl,
            metaKey: this.meta,

            //
            // UIEventInit
            //
            detail: opt?.detail ?? 1,
            view: window,

            //
            // EventInit
            //
            bubbles: true,
            cancelable: true,
            composed: true
        }))
    }

    protected setDeadKey(code: string, value: boolean) {
        switch (code) {
            case "ShiftLeft":
            case "ShiftRight":
                this.shift = value
                break
            case "ControlLeft":
            case "ControlRight":
                this.ctrl = value
                break
            case "AltLeft":
            case "AltRight":
                this.alt = value
                break
            case "MetaLeft":
            case "MetaRight":
                this.meta = value
                break
        }
    }

    private dispatchPointerEvent(type: string, opt?: {
        // button
        button?: number,
        pressure?: number,
        detail?: number,

        relatedTarget?: EventTarget | null,

        // motion
        movementX?: number
        movementY?: number

        // event
        bubbles?: boolean,
        cancelable?: boolean,
        composed?: boolean
    }) {
        // pointerleave has already left the window
        if (type !== "pointerleave") {
            this.target = document.elementFromPoint(this.pos.x, this.pos.y)
        }

        let clientX = this.pos.x, clientY = this.pos.y,
            screenX = this.pos.x + (this.screenDelta?.x ?? 0),
            screenY = this.pos.y + (this.screenDelta?.y ?? 0)

        // as observed in Safari
        if (opt?.button === MMB && (type === "pointerdown" || type === "pointerup")) {
            clientX = Math.floor(clientX)
            clientY = Math.floor(clientY)
            screenX = Math.floor(screenX)
            screenY = Math.floor(screenY)
        }

        if (!this.target) { throw Error("NO TARGET ") }
        this.target.dispatchEvent(new PointerEvent(type, {
            pointerId: 1,

            // size of pointer's contact geometry (ie. finger) in css pixels, default to 1
            // width: e.width,
            // height: e.height,
            pressure: this.buttons ? 0.5 : 0,
            // tangentialPressure: e.tangentialPressure,
            // tiltX: e.tiltX,
            // tiltY: e.tiltY,
            // twist: e.twist,
            // altitudeAngle: e.altitudeAngle,
            // azimuthAngle: e.azimuthAngle,
            pointerType: "mouse",
            // whether this is the devices primary pointing device
            isPrimary: true,

            // screen coordinates
            screenX, screenY,
            // viewport coordinates
            clientX, clientY,

            ctrlKey: this.ctrl,
            shiftKey: this.shift,
            altKey: this.alt,
            metaKey: this.meta,

            button: opt?.button ?? -1,
            buttons: this.buttons,

            relatedTarget: opt?.relatedTarget ?? null,
            movementX: opt?.movementX ?? 0,
            movementY: opt?.movementY ?? 0,
            view: window,

            // click count
            detail: opt?.detail ?? 0,
            bubbles: opt?.bubbles ?? true,
            cancelable: opt?.cancelable ?? true,
            composed: opt?.composed ?? true,
        }))
    }

}


export function getActiveElement(): Element | null {
    let active = document.activeElement
    while (active?.shadowRoot?.activeElement) {
        active = active.shadowRoot.activeElement
    }
    return active
}
