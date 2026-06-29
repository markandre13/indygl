import { BrowserEvent } from "./BrowserEvents"

/**
 * dispatch series of events similar to those caused by user interaction
 */
export class BrowserUser {
    private browser = new BrowserEvent();

    // todo: enter, leave, over, ...
    /**
     * move pointer to the center of the given element
     */
    move(element: HTMLElement) {
        const r = element.getBoundingClientRect()
        this.browser.pointerMove(r.left + r.width / 2, r.top + r.height / 2)
    }

    // todo: focus, blur, mouse*
    click() {
        this.browser.pointerDown(0)
        this.browser.pointerUp()
        this.browser.click()
    }

    ctrlClick() {
        this.browser.keyDown("ControlLeft")
        this.click()
        this.browser.keyUp("ControlLeft")
    }
}
