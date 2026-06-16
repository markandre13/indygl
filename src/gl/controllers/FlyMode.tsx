import { mat4, vec2, vec3 } from 'gl-matrix'
import { matrix2euler } from '../algorithms/euler'
import { Controller } from './Controller'
import type { Context } from '../Context'
import { IconKey, IconMouseLeft, IconMouseMiddle, IconMouseRight, IconOption, IconShift } from 'src/editor/viewkit/InputIcons'
import { deg2rad } from '../algorithms/deg2rad'
import { getCameraPosPitchYaw, type PPY } from '../algorithms/getCameraPosPitchYaw'

// see https://learnopengl.com/Getting-started/Camera

export const D = 180 / Math.PI

/**
 * Fly Mode similar to Blender
 */
export class FlyMode extends Controller {
    private _ctx!: Context
    private osd: FlyModeOnScreenDisplay

    /**
     *  initial camera
     */
    private _initial: mat4
    /**
     * translation
     */
    private _translate: mat4
    /**
     * _rotate0 * _rotate1
     */
    private _rotate: mat4

    /**
     * rotation given by pointer position
     */
    private _rotate0 = vec2.create();
    /**
     * rotation while pointer is close to view border
     */
    // private _rotate1 = vec2.create();
    /**
     * timer based movement via keys, relative to where we look at
     */
    private _move = vec3.create();
    /**
     * timer based drift while the pointer is near the view border
     */
    private _drift = vec2.create();

    private _rotateInitial?: vec2

    private ppy: PPY

    /**
     *
     */
    private _lastUpdate?: number

    constructor(context: Context) {
        super()
        this._ctx = context

        this.ppy = getCameraPosPitchYaw(context.camera.value)
        console.log(this.ppy)

        this._initial = mat4.clone(context.camera.value)
        this._translate = mat4.create()
        this._rotate = mat4.create()

        context.canvas.style.cursor = 'crosshair'

        this.osd = new FlyModeOnScreenDisplay(context)
    }
    override info() {
        return <>
            <span>FLYMODE:</span>
            <IconMouseLeft /><span>Confirm</span>
            <IconMouseRight />/ESC<span>Cancel</span>
            <IconKey key='W' /><IconKey key='A' /><IconKey key='S' /><IconKey key='D' /><span>Move</span>
            <IconKey key='E' /><IconKey key='Q' /><span>Up/Down</span>
            <IconKey key='R' /><IconKey key='F' /><span>Local Up/Down</span>
            <IconShift /><span>Fast</span>
            <IconOption /><span>Slow</span>
            <IconKey key='+' /><IconKey key='-' /><span>Acceleration</span>
            <IconKey key='Z' /><span>Z Axis Correction</span>
        </>
    }
    override pointerdown(ev: PointerEvent): void {
        ev.preventDefault()
        switch (ev.button) {
            case 0:
                this.confirm()
                break
            case 2:
                this.cancel()
                break
        }
    }
    override pointermove(ev: PointerEvent): void {
        ev.preventDefault()

        const canvas = this._ctx.canvas

        const marginX = Math.round(((canvas.width / 2) * 8) / 10)
        const marginY = Math.round(((canvas.height / 2) * 8) / 10)

        const x = canvas.width / 2 - ev.offsetX
        const y = canvas.height / 2 - ev.offsetY
        if (this._rotateInitial === undefined) {
            this._rotateInitial = vec2.fromValues(x, y)
        }

        if (x < -marginX) {
            this._drift[0] = (x + marginX) / 10
        } else if (x > marginX) {
            this._drift[0] = (x - marginX) / 10
        } else {
            this._drift[0] = 0
            this._rotate0[0] = -x + this._rotateInitial[0]
        }

        if (y < -marginY) {
            this._drift[1] = (y + marginY) / 10
        } else if (y > marginY) {
            this._drift[1] = (y - marginY) / 10
        } else {
            this._drift[1] = 0
            this._rotate0[1] = -y + this._rotateInitial[1]
        }

        this.invalidate()
    }
    override keydown(ev: KeyboardEvent): void {
        ev.preventDefault()
        if (ev.repeat) {
            return
        }

        const ctx = this._ctx

        const cameraRotation = mat4.clone(ctx.camera.value)
        mat4.mul(cameraRotation, cameraRotation, this._rotate)
        cameraRotation[12] = cameraRotation[13] = cameraRotation[14] = 0
        mat4.invert(cameraRotation, cameraRotation)

        switch (ev.code) {
            case 'KeyW': // forward
                this._move[2] = 1
                break
            case 'KeyS': // backward
                this._move[2] = -1
                break
            case 'KeyA': // left
                this._move[0] = 1
                break
            case 'KeyD': // right
                this._move[0] = -1
                break
            case 'KeyQ': // down
                this._move[1] = 1
                break
            case 'KeyE': // up
                this._move[1] = -1
                break
            case 'KeyR': // local down
                // mat4.translate(this._translate, this._translate, dirY)
                // mat4.translate(this._translate, this._translate, dirY)
                break
            case 'KeyF': // local up
                // vec3.negate(dirY, dirY)
                // mat4.translate(this._translate, this._translate, dirY)
                break
            case 'Escape':
                this.cancel()
                break
            default:
                return
        }
        this.invalidate()
    }
    override keyup(ev: KeyboardEvent): void {
        ev.preventDefault()
        switch (ev.code) {
            case 'KeyW': // forward
                if (this._move[2] > 0) {
                    this._move[2] = 0
                }
                break
            case 'KeyS': // backward
                if (this._move[2] < 0) {
                    this._move[2] = 0
                }
                break
            case 'KeyA': // left
                if (this._move[0] > 0) {
                    this._move[0] = 0
                }
                break
            case 'KeyD': // right
                if (this._move[0] < 0) {
                    this._move[0] = 0
                }
                break
            case 'KeyQ': // down
                if (this._move[1] > 0) {
                    this._move[1] = 0
                }
                break
            case 'KeyE': // up
                if (this._move[1] < 0) {
                    this._move[1] = 0
                }
                break
        }
    }
    /**
     * quit fly mode and keep current position
     */
    confirm() {
        this._ctx.canvas.style.cursor = ''
        this.osd.destructor()
        this._ctx.popController()
        this._ctx.invalidate()
    }
    /**
     * quit fly mode and reset postion to when fly mode was started
     */
    cancel() {
        this._ctx.camera.value = this._initial
        this.confirm()
    }
    private invalidate() {
        if (this._lastUpdate === undefined) {
            this._lastUpdate = Date.now()
        }
        this._ctx.invalidate()
    }
    override paint() { // FIXME: needs to be called repeatly to move
        this.update()
        if (this._move[0] ||
            this._move[1] ||
            this._move[2] ||
            this._drift[0] ||
            this._drift[1]
        ) {
            // console.log(`FlyMode.paint() -> continue`)
            this.invalidate()
        } else {
            // console.log(`FlyMode.paint() -> done`)
            this._lastUpdate = undefined
        }
    }
    private update() {
        const now = Date.now()

        this.ppy.yaw -= this._drift[0] / D / 10
        this.ppy.pitch += this._drift[1] / D / 10

        this.ppy.pitch = Math.min(this.ppy.pitch, Math.PI / 2)
        this.ppy.pitch = Math.max(this.ppy.pitch, -Math.PI / 2)

        const ppy = this.ppy

        let pitch = ppy.pitch
        let yaw = ppy.yaw + deg2rad(270)

        yaw += this._rotate0[0] / D / 10
        pitch -= this._rotate0[1] / D / 10

        pitch = Math.min(pitch, Math.PI / 2)
        pitch = Math.max(pitch, - Math.PI / 2)

        // const status = document.getElementById("status")!
        // status.innerText = `${this._rotate0[0]} ${this._rotate1[0]} ${this._drift[0]}`

        const direction = vec3.fromValues(
            Math.cos(yaw) * Math.cos(pitch),
            Math.sin(pitch),
            Math.sin(yaw) * Math.cos(pitch),
        )

        const cameraFront = vec3.normalize(vec3.create(), direction)
        const cameraUp = vec3.fromValues(0, 1, 0)

        if (this._move[0] !== 0 || this._move[1] !== 0 || this._move[2] !== 0) {
            const cameraRotation = mat4.lookAt(mat4.create(),
                vec3.create(),
                cameraFront,
                cameraUp
            )
            // rotation is in glcamera, convert to word
            mat4.invert(cameraRotation, cameraRotation)

            const direction = vec3.clone(this._move)
            vec3.transformMat4(direction, direction, cameraRotation)
            const acceleration = (2.5 / 500) * (now - this._lastUpdate!)
            const step = vec3.scale(vec3.create(), direction, acceleration)
            vec3.sub(ppy.pos, ppy.pos, step)
        }

        const camera = mat4.lookAt(mat4.create(),
            ppy.pos, // eye
            vec3.add(vec3.create(), ppy.pos, cameraFront), // focal point
            cameraUp // up
        )

        this._ctx.camera.value = camera

        this.osd.update()

        this._lastUpdate = now
    }
}

export class FlyModeOnScreenDisplay {
    private context: Context
    private overlaySVG: SVGElement
    private _caret: SVGGElement
    constructor(context: Context) {
        this.context = context
        this.overlaySVG = document.getElementById("svg-overlay") as any
        const canvas = context.canvas

        const centerX = Math.round(canvas.width / 2)
        const centerY = Math.round(canvas.height / 2)

        // also display pos & rotation in overlay?
        this._caret = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'g'
        )
        function rect(x: number, y: number, w: number, h: number) {
            const rect: SVGRectElement = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'rect'
            )
            rect.setAttributeNS(null, 'x', `${x}`)
            rect.setAttributeNS(null, 'y', `${y}`)
            rect.setAttributeNS(null, 'rx', `3`)
            rect.setAttributeNS(null, 'ry', `3`)
            rect.setAttributeNS(null, 'width', `${w}`)
            rect.setAttributeNS(null, 'height', `${h}`)
            rect.setAttributeNS(null, 'stroke', `#fff`)
            rect.setAttributeNS(null, 'stroke-width', `1`)
            rect.setAttributeNS(null, 'fill', `#000`)
            return rect
        }
        function line(x1: number, y1: number, x2: number, y2: number): SVGLineElement {
            const line = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "line"
            )
            line.setAttributeNS(null, 'x1', `${x1}`)
            line.setAttributeNS(null, 'y1', `${y1}`)
            line.setAttributeNS(null, 'x2', `${x2}`)
            line.setAttributeNS(null, 'y2', `${y2}`)
            line.setAttributeNS(null, 'stroke', `#000`)
            line.setAttributeNS(null, 'stroke-width', `1`)
            return line
        }
        this._caret.appendChild(line(centerX - 28, centerY, centerX - 14, centerY))
        this._caret.appendChild(line(centerX + 28, centerY, centerX + 14, centerY))
        this._caret.appendChild(line(centerX, centerY - 28, centerX, centerY - 14))
        this._caret.appendChild(line(centerX, centerY + 28, centerX, centerY + 14))

        const cam = this.context.sceneUniforms.camera
        const v = vec3.create()
        const ic = mat4.invert(mat4.create(), cam)!
        vec3.transformMat4(v, v, ic)
        let text = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'text'
        )
        text.setAttributeNS(null, 'x', `10`)
        text.setAttributeNS(null, 'y', `20`)
        text.setAttributeNS(null, 'fill', `#fff`)
        text.appendChild(
            document.createTextNode(
                `POS: ${cam[12].toFixed(2)}, ${cam[13].toFixed(
                    2
                )}, ${cam[14].toFixed(2)}`
            )
        )
        this._caret.appendChild(text)

        const r = matrix2euler(cam, 'syxz')
        const D = 360 / 2 / Math.PI
        r.x *= D
        r.y *= D
        r.z *= D
        text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        text.setAttributeNS(null, 'x', `10`)
        text.setAttributeNS(null, 'y', `40`)
        text.setAttributeNS(null, 'fill', `#fff`)
        text.appendChild(
            document.createTextNode(
                `ROT: ${r.x.toFixed(2)}, ${r.y.toFixed(2)}, ${r.z.toFixed(2)}`
            )
        )
        this._caret.appendChild(text)

        this.overlaySVG.appendChild(this._caret)
    }
    destructor() {
        this.overlaySVG.removeChild(this._caret)
    }
    update() {
        const cam = this.context.sceneUniforms.camera
        const v = vec3.create()
        const ic = mat4.invert(mat4.create(), cam)!
        vec3.transformMat4(v, v, ic);
        (this._caret.children[4] as SVGTextElement)
            .innerHTML = `POS: ${v[0].toFixed(2)}, ${v[1].toFixed(2)}, ${v[2].toFixed(2)}`
        const r = matrix2euler(cam, 'syxz')
        const D = 360 / 2 / Math.PI
        r.x *= D
        r.y *= D
        r.z *= D;
        (this._caret.children[5] as SVGTextElement)
            .innerHTML = `ROT: ${r.x.toFixed(2)}, ${r.y.toFixed(2)}, ${r.z.toFixed(2)}`
    }
}
