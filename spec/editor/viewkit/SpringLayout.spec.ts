import { type SpringLayoutElementApi, SpringLayout } from "src/editor/viewkit/SpringLayout"
import { describe, expect, it } from "vitest"
import { fit } from "../../spec"

describe("SpringLayout", () => {
    describe("attach child to parent", () => {
        it("attach top to parent", () => {
            const parent = makeElement(null, 10, 20, 1920, 1080)
            const child = makeElement(parent, 100, 100, 320, 200)
            SpringLayout.create()
                .element(child).top()
                .build()
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
            SpringLayout.create()
                .element(child).left()
                .build()
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
            SpringLayout.create()
                .element(child).right()
                .build()
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
            SpringLayout.create()
                .element(child).bottom()
                .build()
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
            SpringLayout.create()
                .element(child).top().left().right().bottom()
                .build()
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
            SpringLayout.create()
                .element(child).top().left().right()
                .build()
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
            SpringLayout.create()
                .element(child).top().left()
                .build()
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
            SpringLayout.create()
                .element(child0).top().left()
                .element(child1).left(child0)
                .build()
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
            SpringLayout.create()
                .element(child0).top().left()
                .element(child1).top(child0)
                .build()
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
            SpringLayout.create()
                .element(child0).top().right()
                .element(child1).right(child0)
                .build()
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
            SpringLayout.create()
                .element(child0).bottom().right()
                .element(child1).bottom(child0)
                .build()
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
            SpringLayout.create()
                .element(child0)
                .element(child1).left(child0).right(child0)
                .build()
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
            SpringLayout.create()
                .element(child0)
                .element(child1).top(child0).bottom(child0)
                .build()
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
        it("attach to parent and two children", () => {
            const parent = makeElement(null, 10, 20, 1920, 1080)
            const child0 = makeElement(parent, 31, 41, 51, 11)
            const child1 = makeElement(parent, 32, 43, 52, 12)
            const child2 = makeElement(parent, 33, 43, 53, 13)

            SpringLayout.create()
                .element(child0).top().left().right()
                .element(child1).top(child0).right().bottom(child2)
                .element(child2).bottom().left().right()
                .build()
            expect(child0.style).to.deep.equal({
                "boxSizing": "border-box",
                "position": "absolute",
                "left": "0px",
                "top": "0px",
                "width": "1920px",
                "height": "11px",
            })
            expect(child1.style).to.deep.equal({
                "boxSizing": "border-box",
                "position": "absolute",
                "left": `${1920 - 52}px`,
                "top": "11px",
                "width": "52px",
                "height": `${1080 - 11 - 13}px`,
            })
            expect(child2.style).to.deep.equal({
                "boxSizing": "border-box",
                "position": "absolute",
                "left": "0px",
                "top": `${1080 - 13}px`,
                "width": "1920px",
                "height": "13px",
            })
        })
    })
    describe("error handling", () => {
        it("left and right recursion", () => {
            const parent = makeElement(null, 10, 20, 1920, 1080)
            const child0 = makeElement(parent, 31, 41, 51, 11)
            const child1 = makeElement(parent, 32, 43, 52, 12)
            expect(() => {
                SpringLayout.create()
                    .element(child0).left(child1)
                    .element(child1).right(child0)
                    .build()
            }).toThrow("FormLayout: circular dependency between left and right")
        })
        it("top and bottom recursion", () => {
            const parent = makeElement(null, 10, 20, 1920, 1080)
            const child0 = makeElement(parent, 31, 41, 51, 11)
            const child1 = makeElement(parent, 32, 43, 52, 12)
            expect(() => {
                SpringLayout.create()
                    .element(child0).top(child1)
                    .element(child1).bottom(child0)
                    .build()
            }).toThrow("FormLayout: circular dependency between top and bottom")
        })
    })
})

function makeElement(parent: SpringLayoutElementApi | null, x: number, y: number, w: number, h: number): SpringLayoutElementApi {
    return {
        parentElement: parent,
        getBoundingClientRect: () => ({ left: x, top: y, width: w, height: h }),
        style: { position: "", boxSizing: "", left: "", top: "", width: "", height: "" }
    }
}