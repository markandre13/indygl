import { LengthModel } from 'src/editor/appkit/units/LengthModel'
import { TupleElementInput } from 'src/editor/viewkit/TupleElementInput'
import { replaceChildren } from 'toad.jsx/jsx-runtime'
import { describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'

describe("TupleElementInput", () => {
    it("clicking on the right button increments the model", async () => {
        let view!: HTMLElement
        const model = new LengthModel(0, { step: 1 })
        replaceChildren(document.body, <TupleElementInput ref={view} model={model} />)

        const buttons = document.querySelectorAll("button")
        const locator = page.elementLocator(buttons[1])
        await locator.click()

        expect(model.toNumber()).to.equal(1)
    })

    it("clicking on the left button decrements the model", async () => {
        let view!: HTMLElement
        const model = new LengthModel(0, { step: 1 })
        replaceChildren(document.body, <TupleElementInput ref={view} model={model} />)

        const buttons = document.querySelectorAll("button")
        const locator = page.elementLocator(buttons[0])
        await locator.click()

        expect(model.toNumber()).to.equal(-1)
    })

    it("entering a value changes the model", async () => {
        let view!: HTMLElement
        const model = new LengthModel(0, { step: 1 })
        replaceChildren(document.body, <TupleElementInput ref={view} model={model} />)

        const input = document.querySelector("input") as HTMLInputElement
        const locator = page.elementLocator(input)
        await locator.click()
        await locator.fill("42cm")
        input.dispatchEvent(new Event("change"))

        expect(model.toNumber()).to.equal(0.42)
    })

    it("scrolling up on the capture area increments the model", async () => {
        let view!: HTMLElement
        const model = new LengthModel(0, { step: 1 })
        replaceChildren(document.body, <TupleElementInput ref={view} model={model} />)

        const capture = document.querySelector("div.gl-input > div")!
        capture.dispatchEvent(new WheelEvent("wheel", { deltaY: -120, cancelable: true }))

        expect(model.toNumber()).to.equal(1)
    })

    it("scrolling down on the capture area decrements the model", async () => {
        let view!: HTMLElement
        const model = new LengthModel(0, { step: 1 })
        replaceChildren(document.body, <TupleElementInput ref={view} model={model} />)

        const capture = document.querySelector("div.gl-input > div")!
        capture.dispatchEvent(new WheelEvent("wheel", { deltaY: 120, cancelable: true }))

        expect(model.toNumber()).to.equal(-1)
    })

    it("scrolling with shiftKey applies finer step", async () => {
        let view!: HTMLElement
        const model = new LengthModel(0, { step: 1 })
        replaceChildren(document.body, <TupleElementInput ref={view} model={model} />)

        const capture = document.querySelector("div.gl-input > div")!
        capture.dispatchEvent(new WheelEvent("wheel", { deltaY: -120, shiftKey: true, cancelable: true }))

        expect(model.toNumber()).to.equal(0.1)
    })

    it("scrolling with ctrlKey snaps to step multiples", async () => {
        let view!: HTMLElement
        const model = new LengthModel(0, { step: 0.5 })
        replaceChildren(document.body, <TupleElementInput ref={view} model={model} />)

        const capture = document.querySelector("div.gl-input > div")!
        // ctrlKey: step = step * 10 = 5, then snap: value = round(2.4 / 5) * 5 = 0
        // deltaY > 0 → value.minus(step) = 0 - 5 = -5, snap: round(-5/5)*5 = -5
        capture.dispatchEvent(new WheelEvent("wheel", { deltaY: 120, ctrlKey: true, cancelable: true }))

        expect(model.toNumber()).to.equal(-5)
    })

    it("displays the label and formatted value with unit", () => {
        const model = new LengthModel(0, { step: 1 })
        replaceChildren(document.body, <TupleElementInput model={model} />)

        expect(document.querySelector(".gl-input")!.textContent).to.include("0 m")
    })

    it("focuses the input when edit is true", async () => {
        const model = new LengthModel(0, { step: 1 })
        replaceChildren(document.body, <TupleElementInput model={model} edit={true} />)

        await new Promise(requestAnimationFrame)
        const input = document.querySelector("input")!
        expect(document.activeElement).to.equal(input)
    })

    it("dragging pointer to the right increases the value", async () => {
        let view!: HTMLElement
        const model = new LengthModel(0, { step: 1 })
        replaceChildren(document.body, <TupleElementInput ref={view} model={model} />)

        const capture = document.querySelector("div.gl-input > div") as HTMLDivElement

        capture.dispatchEvent(new PointerEvent("pointerdown", {
            clientX: 100,
            pointerId: 1,
            bubbles: true,
            cancelable: true,
        }))
        capture.dispatchEvent(new PointerEvent("pointermove", {
            clientX: 105,
            pointerId: 1,
            bubbles: true,
            cancelable: true,
        }))

        expect(model.toNumber()).to.equal(5)
    })

    it("dragging pointer to the left decreases the value", async () => {
        let view!: HTMLElement
        const model = new LengthModel(0, { step: 1 })
        replaceChildren(document.body, <TupleElementInput ref={view} model={model} />)

        const capture = document.querySelector("div.gl-input > div") as HTMLDivElement

        capture.dispatchEvent(new PointerEvent("pointerdown", {
            clientX: 100,
            pointerId: 1,
            bubbles: true,
            cancelable: true,
        }))
        capture.dispatchEvent(new PointerEvent("pointermove", {
            clientX: 93,
            pointerId: 1,
            bubbles: true,
            cancelable: true,
        }))

        expect(model.toNumber()).to.equal(-7)
    })
})