import { describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { xit } from '../spec'

describe("foo", () => {
    xit("skip", () => {

    })
    it("only", async () => {
        const div = document.createElement("div")
        div.dataset["testid"] = "hero"
        div.style.width = "100px"
        div.style.height = "100px"
        const txt = document.createTextNode("hello word")
        div.appendChild(txt)
        document.body.appendChild(div)
        await expect(page.getByTestId('hero')).toMatchScreenshot('hero-section')
    })
})
