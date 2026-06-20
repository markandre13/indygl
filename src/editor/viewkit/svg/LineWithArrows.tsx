import { rad2deg } from "src/gl/algorithms/rad2deg"
import type { Point } from "src/gl/types/Point"


export class LineWithArrows {
    private p0: Point = { x: 0, y: 0 }
    private p1: Point = { x: 0, y: 0 }
    private line: SVGLineElement
    private lineShadow: SVGLineElement
    private arrow: SVGGElement
    private _angle: number

    constructor(parent: HTMLElement, p0: Point, p1: Point, color: string, angle: number = 0) {

        const lineShadow = document.createElementNS("http://www.w3.org/2000/svg", "line")
        lineShadow.setAttribute("stroke", "#000")
        lineShadow.setAttribute("stroke-width", "1")
        lineShadow.setAttribute("stroke-dasharray", "4")

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line")
        line.setAttribute("stroke", color)
        line.setAttribute("stroke-width", "1")
        line.setAttribute("stroke-dasharray", "4")
  
        const arrow = <g fill="none">
            <path stroke="#000" stroke-width="3.5" d="
                M 0 5 L 0 15
                M -5 10 L 0 15 L 5 10
                M 0 -5 L 0 -15
                M -5 -10 L 0 -15 L 5 -10
            "/>
            <path stroke={color} stroke-width="2" d="
                M 0 5 L 0 15
                M -5 10 L 0 15 L 5 10
                M 0 -5 L 0 -15
                M -5 -10 L 0 -15 L 5 -10
            "/>
        </g> as SVGGElement

        this._angle = angle
        this.arrow = arrow
        this.lineShadow = lineShadow
        this.line = line

        this.setP0(p0)
        this.setP1(p1)

        parent.appendChild(lineShadow)
        parent.appendChild(line)
        parent.appendChild(arrow)
    }
    setP0(p0: Point) {
        this.p0.x = p0.x
        this.p0.y = p0.y
        this.lineShadow.setAttribute("x1", `${p0.x + 0.5}`)
        this.lineShadow.setAttribute("y1", `${p0.y + 0.5}`)
        this.line.setAttribute("x1", `${p0.x - 0.5}`)
        this.line.setAttribute("y1", `${p0.y - 0.5}`)
    }
    setP1(p1: Point) {
        this.p1.x = p1.x
        this.p1.y = p1.y
        this.lineShadow.setAttribute("x2", `${p1.x + 0.5}`)
        this.lineShadow.setAttribute("y2", `${p1.y + 0.5}`)
        this.line.setAttribute("x2", `${p1.x - 0.5}`)
        this.line.setAttribute("y2", `${p1.y - 0.5}`)
        this.arrow.setAttribute("transform", `translate(${p1.x},${p1.y}) rotate(${rad2deg(this.angle + this._angle)})`)
    }
    remove() {
        this.lineShadow.remove()
        this.line.remove()
        this.arrow.remove()
    }
    get angle() {
        return Math.atan2(this.p1.y - this.p0.y, this.p1.x - this.p0.x)
    }
}
