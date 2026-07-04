import { BrowserEvent } from "./BrowserEvents"

/**
 * dispatch series of events similar to those caused by user interaction
 */
export class BrowserUser {
    private browser = new BrowserEvent();

    /**
     * move pointer to the center of the given element
     * 
     * generates leave, enter and move events
     */
    move(element: HTMLElement) {
        const r = element.getBoundingClientRect()
        const x = r.left + r.width / 2
        const y = r.top + r.height / 2
        const target = document.elementFromPoint(x, y)
        if (this.browser.target !== target) {
            if (this.browser.target) {
                this.browser.pointerLeave(x, y, target)
            }
            this.browser.pointerEnter(x, y, this.browser.target)
        }
        this.browser.pointerMove(r.left + r.width / 2, r.top + r.height / 2)
    }

    /**
     * left mouse button down and up
     * 
     * generates down, blur, focus, up and click events
     */
    click() {
        this.browser.pointerDown(0)
        if (this.browser.target instanceof HTMLElement) {
            if (this.browser.target.tabIndex >= 0) {
                this.browser.target.focus()
            }
        }
        this.browser.pointerUp()
        this.browser.click()
    }

    ctrlClick() {
        this.browser.keyDown("ControlLeft")
        this.click()
        this.browser.keyUp("ControlLeft")
    }
}
