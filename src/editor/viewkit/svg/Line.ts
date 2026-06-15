import type { Point } from "src/gl/types/Point"

export class Line {
    #line: SVGLineElement
    constructor(parent: HTMLElement, p0: Point, p1: Point, color: string) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line")
        line.setAttribute("x1", `${p0.x}`)
        line.setAttribute("y1", `${p0.y}`)
        line.setAttribute("x2", `${p1.x}`)
        line.setAttribute("y2", `${p1.y}`)
        line.setAttribute("stroke", color)
        line.setAttribute("stroke-width", "2")
        parent.appendChild(line)
        this.#line = line
    }
}
