import { LengthModel } from 'src/editor/appkit/units/LengthModel'
import { TupleElementInput } from 'src/editor/viewkit/TupleElementInput'
import { replaceChildren } from 'toad.jsx/jsx-runtime'
import { describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { fit } from '../../spec'

describe("TupleElementInput", () => {
    it("clicking on the right button increments the model", async () => {
        // GIVEN an view and it's model

        let view!: HTMLElement
        const model = new LengthModel(0, { step: 1 })
        replaceChildren(document.body, <TupleElementInput ref={view} model={model} />)

        // WHEN the 2nd button is clicked
        const buttons = document.querySelectorAll("button")
        const locator = page.elementLocator(buttons[1])
        await locator.click()

        // THEN the model's value has been incremented
        expect(model.toNumber()).to.equal(1)
    })
    it("entering a value changes the model", async () => {
        // GIVEN an view and it's model

        let view!: HTMLElement
        const model = new LengthModel(0, { step: 1 })
        replaceChildren(document.body, <TupleElementInput ref={view} model={model} />)

        // WHEN a value is typed in an submitted
        const input = document.querySelector("input") as HTMLInputElement
        const locator = page.elementLocator(input)
        await locator.click()
        await locator.fill("42cm")
        input.dispatchEvent(new Event("change"))
            
        // THEN the model contains the value
        expect(model.toNumber()).to.equal(0.42)
    })
})