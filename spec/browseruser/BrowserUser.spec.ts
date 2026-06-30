import { describe, expect, it } from "vitest"
import { event2data } from "./event2data"
import { BrowserUser } from "./BrowserUser"
import { getActiveElement } from "./BrowserEvents"

const store: any[] = []

describe("BrowserUser", () => {
    // pointerleave (relatedTarget) -> pointerenter -> mouseenter -> pointermove -> mousemove -> pointerleave -> mouseleave
    it("move, enter, leave", () => {
        const { div1, div2 } = makeScene()
        const user = new BrowserUser()

        store.length = 0
        user.move(div1)
        // console.log(store)
        expect(store).to.have.lengthOf(2)
        expect(store[0]).toMatchObject({
            type: "pointerenter",
            target: "div1",
        })
        expect(store[1]).toMatchObject({
            type: "pointermove",
            target: "div1",
        })

        store.length = 0
        user.move(div2)
        // console.log(store)

        expect(store).to.have.lengthOf(3)
        expect(store[0]).toMatchObject({
            type: "pointerleave",
            target: "div1",
            relatedTarget: "div2",
        })
        expect(store[1]).toMatchObject({
            type: "pointerenter",
            target: "div2",
            relatedTarget: "div1",
        })
        expect(store[2]).toMatchObject({
            type: "pointermove",
            target: "div2",
        })
    })

    // pointerdown -> mousedown -> blur (relatedTarget) -> focus -> pointerup -> mouseup -> click
    it("down, blur, focus, up, click", () => {
        const { div1, div2 } = makeScene()
        const user = new BrowserUser()
        user.move(div1)

        store.length = 0
        user.click()

        expect(getActiveElement()).to.equal(div1)

        expect(store).to.have.lengthOf(4)
        expect(store[0]).toMatchObject({ type: "pointerdown", target: "div1" })
        expect(store[1]).toMatchObject({ type: "focus", target: "div1" })
        expect(store[2]).toMatchObject({ type: "pointerup", target: "div1" })
        expect(store[3]).toMatchObject({ type: "click", target: "div1" })

        user.move(div2)
        store.length = 0
        user.click()

        expect(getActiveElement()).to.equal(div2)
        expect(store).to.have.lengthOf(5)
        expect(store[0]).toMatchObject({ type: "pointerdown", target: "div2" })
        expect(store[1]).toMatchObject({ type: "blur", target: "div1", relatedTarget: "div2" })
        expect(store[2]).toMatchObject({ type: "focus", target: "div2", relatedTarget: "div1" })
        expect(store[3]).toMatchObject({ type: "pointerup", target: "div2" })
        expect(store[4]).toMatchObject({ type: "click", target: "div2" })
    })

})

function track(e: Event) {
    // console.trace(`----------------------------- ${e.type}`)
    store.push(event2data(e))
    e.stopPropagation()
}

function makeScene() {
    const div0 = document.createElement("div")
    div0.dataset["testid"] = "div0"
    div0.style.width = "600px"
    div0.style.height = "400px"
    div0.style.background = '#f84'
    div0.style.padding = "10px"

    const div1 = document.createElement("div")
    div1.dataset["testid"] = "div1"
    div1.style.position = "absolute"
    div1.style.left = "100px"
    div1.style.top = "100px"
    div1.style.width = "200px"
    div1.style.height = "200px"
    div1.style.background = '#8f4'
    div1.style.padding = "10px"
    div1.tabIndex = 0
    div1.contentEditable = "true"

    const div2 = document.createElement("div")
    div2.dataset["testid"] = "div2"
    div2.style.position = "absolute"
    div2.style.left = "300px"
    div2.style.top = "100px"
    div2.style.width = "200px"
    div2.style.height = "200px"
    div2.style.background = '#48f'
    div2.style.padding = "10px"
    div2.tabIndex = 0
    div2.contentEditable = "true"

    div0.appendChild(div1)
    div0.appendChild(div2)
    document.body.replaceChildren(div0)

    for (const element of [div0, div1, div2]) {
        element.onblur = track
        element.onfocus = track
        element.onpointerenter = track
        element.onpointerleave = track
        element.onpointermove = track
        element.onpointerdown = track
        element.onpointerup = track
        element.onclick = track
    }

    return { div0, div1, div2 }
}