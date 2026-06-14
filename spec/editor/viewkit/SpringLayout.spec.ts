import { type HTMLElementApi, SpringLayout } from "src/editor/viewkit/SpringLayout"
import { describe, expect, it } from "vitest"

describe("SpringLayout", () => {
    describe("attach child to parent", () => {
        it("attach top to parent", () => {
            const parent = makeElement(null, 10, 20, 1920, 1080)
            const child = makeElement(parent, 100, 100, 320, 200)
            new SpringLayout([
                { element: child, where: ["top"] }
            ])
            expect(child.style).to.deep.equal({
                "boxSizing": "border-box",
                "position": "absolute",
                "left": "100px",
                "top": "0px",
                "width": "320px",
                "height": "200px",
            })
        })
        it("attach left to parent", () => {
            const parent = makeElement(null, 10, 20, 1920, 1080)
            const child = makeElement(parent, 100, 100, 320, 200)
            new SpringLayout([
                { element: child, where: ["left"] }
            ])
            expect(child.style).to.deep.equal({
                "boxSizing": "border-box",
                "position": "absolute",
                "left": "0px",
                "top": "100px",
                "width": "320px",
                "height": "200px",
            })
        })
        it("attach right to parent", () => {
            const parent = makeElement(null, 10, 20, 1920, 1080)
            const child = makeElement(parent, 100, 100, 320, 200)
            new SpringLayout([
                { element: child, where: ["right"] }
            ])
            expect(child.style).to.deep.equal({
                "boxSizing": "border-box",
                "position": "absolute",
                "left": `${1920 - 320}px`,
                "top": "100px",
                "width": "320px",
                "height": "200px",
            })
        })
        it("attach bottom to parent", () => {
            const parent = makeElement(null, 10, 20, 1920, 1080)
            const child = makeElement(parent, 100, 100, 320, 200)
            new SpringLayout([
                { element: child, where: ["bottom"] }
            ])
            expect(child.style).to.deep.equal({
                "boxSizing": "border-box",
                "position": "absolute",
                "left": "100px",
                "top": `${1080 - 200}px`,
                "width": "320px",
                "height": "200px",
            })
        })
        it("attach top, left, right, bottom to parent", () => {
            const parent = makeElement(null, 10, 20, 1920, 1080)
            const child = makeElement(parent, 100, 100, 320, 200)
            new SpringLayout([
                { element: child, where: ["top", "left", "right", "bottom"] }
            ])
            expect(child.style).to.deep.equal({
                "boxSizing": "border-box",
                "position": "absolute",
                "left": "0px",
                "top": "0px",
                "width": "1920px",
                "height": "1080px",
            })
        })
        it("attach top, left, right to parent", () => {
            const parent = makeElement(null, 10, 20, 1920, 1080)
            const child = makeElement(parent, 100, 100, 320, 200)
            new SpringLayout([
                { element: child, where: ["top", "left", "right"] }
            ])
            expect(child.style).to.deep.equal({
                "boxSizing": "border-box",
                "position": "absolute",
                "left": "0px",
                "top": "0px",
                "width": "1920px",
                "height": "200px",
            })
        })
        it("attach top, left to parent", () => {
            const parent = makeElement(null, 10, 20, 1920, 1080)
            const child = makeElement(parent, 100, 100, 320, 200)
            new SpringLayout([
                { element: child, where: ["top", "left"] }
            ])
            expect(child.style).to.deep.equal({
                "boxSizing": "border-box",
                "position": "absolute",
                "left": "0px",
                "top": "0px",
                "width": "320px",
                "height": "200px",
            })
        })
    })
    describe("attach child to child", () => {
        it("attach left to child", () => {
            const parent = makeElement(null, 10, 20, 1920, 1080)
            const child0 = makeElement(parent, 30, 40, 50, 60)
            const child1 = makeElement(parent, 70, 80, 90, 100)

            new SpringLayout([
                { element: child0, where: ["top", "left"] },
                { element: child1, where: ["left"], which: child0 }
            ])
            expect(child0.style).to.deep.equal({
                "boxSizing": "border-box",
                "position": "absolute",
                "left": "0px",
                "top": "0px",
                "width": "50px",
                "height": "60px",
            })
            expect(child1.style).to.deep.equal({
                "boxSizing": "border-box",
                "position": "absolute",
                "left": "50px",
                "top": "80px",
                "width": "90px",
                "height": "100px",
            })
        })
        it("attach top to child", () => {
            const parent = makeElement(null, 10, 20, 1920, 1080)
            const child0 = makeElement(parent, 30, 40, 50, 60)
            const child1 = makeElement(parent, 70, 80, 90, 100)

            new SpringLayout([
                { element: child0, where: ["top", "left"] },
                { element: child1, where: ["top"], which: child0 }
            ])
            expect(child0.style).to.deep.equal({
                "boxSizing": "border-box",
                "position": "absolute",
                "left": "0px",
                "top": "0px",
                "width": "50px",
                "height": "60px",
            })
            expect(child1.style).to.deep.equal({
                "boxSizing": "border-box",
                "position": "absolute",
                "left": "70px",
                "top": "60px",
                "width": "90px",
                "height": "100px",
            })
        })
        it("attach right to child", () => {
            const parent = makeElement(null, 10, 20, 1920, 1080)
            const child0 = makeElement(parent, 30, 40, 50, 60)
            const child1 = makeElement(parent, 70, 80, 90, 100)

            new SpringLayout([
                { element: child0, where: ["top", "right"] },
                { element: child1, where: ["right"], which: child0 }
            ])
            expect(child0.style).to.deep.equal({
                "boxSizing": "border-box",
                "position": "absolute",
                "left": "1870px",
                "top": "0px",
                "width": "50px",
                "height": "60px",
            })
            expect(child1.style).to.deep.equal({
                "boxSizing": "border-box",
                "position": "absolute",
                "left": "1780px",
                "top": "80px",
                "width": "90px",
                "height": "100px",
            })
        })
        it("attach bottom to child", () => {
            const parent = makeElement(null, 10, 20, 1920, 1080)
            const child0 = makeElement(parent, 30, 40, 50, 60)
            const child1 = makeElement(parent, 70, 80, 90, 100)

            new SpringLayout([
                { element: child0, where: ["bottom", "right"] },
                { element: child1, where: ["bottom"], which: child0 }
            ])
            expect(child0.style).to.deep.equal({
                "boxSizing": "border-box",
                "position": "absolute",
                "left": "1870px",
                "top": "1020px",
                "width": "50px",
                "height": "60px",
            })
            expect(child1.style).to.deep.equal({
                "boxSizing": "border-box",
                "position": "absolute",
                "left": "70px",
                "top": "920px",
                "width": "90px",
                "height": "100px",
            })
        })
        it("attach left, right to child", () => {
            const parent = makeElement(null, 10, 20, 1920, 1080)
            const child0 = makeElement(parent, 30, 40, 50, 60)
            const child1 = makeElement(parent, 70, 80, 90, 100)
            new SpringLayout([
                { element: child0, where: [] },
                { element: child1, where: ["left", "right"], which: child0 }
            ])
            expect(child0.style).to.deep.equal({
                "boxSizing": "border-box",
                "position": "absolute",
                "left": "30px",
                "top": "40px",
                "width": "50px",
                "height": "60px",
            })
            expect(child1.style).to.deep.equal({
                "boxSizing": "border-box",
                "position": "absolute",
                "left": "30px",
                "top": "80px",
                "width": "50px",
                "height": "100px",
            })
        })
        it("attach top, bottom to child", () => {
            const parent = makeElement(null, 10, 20, 1920, 1080)
            const child0 = makeElement(parent, 30, 40, 50, 60)
            const child1 = makeElement(parent, 70, 80, 90, 100)
            new SpringLayout([
                { element: child0, where: [] },
                { element: child1, where: ["top", "bottom"], which: child0 }
            ])
            expect(child0.style).to.deep.equal({
                "boxSizing": "border-box",
                "position": "absolute",
                "left": "30px",
                "top": "40px",
                "width": "50px",
                "height": "60px",
            })
            expect(child1.style).to.deep.equal({
                "boxSizing": "border-box",
                "position": "absolute",
                "left": "70px",
                "top": "40px",
                "width": "90px",
                "height": "60px",
            })
        })
    })
})

function makeElement(parent: HTMLElementApi | null, x: number, y: number, w: number, h: number): HTMLElementApi {
    return {
        parentElement: parent,
        getBoundingClientRect: () => ({ left: x, top: y, width: w, height: h }),
        style: { position: "", boxSizing: "", left: "", top: "", width: "", height: "" }
    }
}