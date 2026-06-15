import type { Point } from "src/gl/types/Point"

export class Circle {
    #circle: SVGCircleElement
    constructor(parent: HTMLElement, pt: Point, color: string) {
        const svgNS = "http://www.w3.org/2000/svg"
        const circle = document.createElementNS(svgNS, "circle")
        circle.setAttribute("cx", `${pt.x}`)
        circle.setAttribute("cy", `${pt.y}`)
        circle.setAttribute("r", "3")
        circle.setAttribute("fill", color)
        parent.appendChild(circle)
        this.#circle = circle
    }
    set(pt: Point) {
        this.#circle.setAttribute("cx", `${pt.x}`)
        this.#circle.setAttribute("cy", `${pt.y}`)
    }
    remove() {
        this.#circle.remove()
    }
}

