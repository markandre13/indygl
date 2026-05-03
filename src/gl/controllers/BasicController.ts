import { mat4, vec3 } from 'gl-matrix'
import { Controller } from './Controller'
import { Projection, type CanvasContext } from '../CanvasContext'
import { deg2rad } from '../algorithms/deg2rad'
import { MouseButton } from './details/MouseButton'
import { FlyMode } from './FlyMode'

interface Point {
    x: number,
    y: number
}

export class BasicMode extends Controller {
    private context: CanvasContext
    constructor(view: CanvasContext) {
        super()
        this.context = view
    }
    override info() {
        return "Basic: `: FlyMode"
    }
    override keydown(ev: KeyboardEvent): void {
        const ctx = this.context
        switch (ev.code) {
            case 'Numpad1': // front orthographic
                if (ev.ctrlKey) {
                    // back
                    ctx.rotateCameraTo(0, 180, 0)
                } else {
                    // front
                    ctx.rotateCameraTo(0, 0, 0)
                }
                ctx.projection = Projection.ORTHOGONAL
                // this._context.invalidate()
                break
            case 'Numpad7': // top orthographic
                if (ev.ctrlKey) {
                    // bottom
                    ctx.rotateCameraTo(-90, 0, 0)
                } else {
                    // top
                    ctx.rotateCameraTo(90, 0, 0)
                }
                ctx.projection = Projection.ORTHOGONAL
                // this._context.invalidate()
                break
            case 'Numpad3':
                if (ev.ctrlKey) {
                    // left
                    ctx.rotateCameraTo(0, 90, 0)
                } else {
                    // right
                    ctx.rotateCameraTo(0, -90, 0)
                }
                ctx.projection = Projection.ORTHOGONAL
                // this._context.invalidate()
                break
            case 'Numpad4':
                ctx.camera.rotateY(deg2rad(11.25))
                break
            case 'Numpad6':
                ctx.camera.rotateY(deg2rad(-11.25))
                break
            case 'Numpad8':
                ctx.camera.rotateX(deg2rad(11.25))
                break
            case 'Numpad2':
                ctx.camera.rotateX(deg2rad(-11.25))
                break
            case 'Numpad5': // toggle orthographic/perspective
                if (ctx.projection === Projection.ORTHOGONAL) {
                    ctx.projection = Projection.PERSPECTIVE
                } else {
                    ctx.projection = Projection.ORTHOGONAL
                }
                // this._context.invalidate()
                break
            case 'Numpad0':
                // camera view
                this.context.resetCamera()
                break
            case 'NumpadDecimal':
                // focus selected
                break
            case 'Backquote':
                if (ev.shiftKey) {
                    this.context.pushController(new FlyMode(this.context))
                }
                break
            default:
            // console.log(ev)
        }
    }

    private _down: Point | undefined
    private _camera: mat4 = mat4.create()
    private _center: vec3 = vec3.create()

    override pointerdown(ev: PointerEvent): void {
        if (ev.button !== MouseButton.MIDDLE) {
            return
        }
        this.context.canvas.setPointerCapture(ev.pointerId)
        this._down = { x: ev.x, y: ev.y }
        this._camera = mat4.clone(this.context.camera.value)
        this._center = this.selectionCenter()
        ev.preventDefault()
    }
    override pointermove(ev: PointerEvent): void {
        if (this._down === undefined) {
            return
        }
        ev.preventDefault()

        const x = ev.x - this._down.x
        const y = ev.y - this._down.y

        const cameraRotation = mat4.clone(this._camera!)
        cameraRotation[12] = cameraRotation[13] = cameraRotation[14] = 0
        const invCameraRotation = mat4.invert(mat4.create(), cameraRotation)!

        const moveToRotationCenter = mat4.create()
        mat4.translate(
            moveToRotationCenter,
            moveToRotationCenter,
            this._center!
        )

        const backFromRotationCenter = mat4.invert(mat4.create(), moveToRotationCenter)!

        const m = mat4.create()
        mat4.mul(m, m, moveToRotationCenter)
        mat4.mul(m, m, invCameraRotation)
        mat4.rotateX(m, m, deg2rad(y))
        mat4.mul(m, m, cameraRotation)
        mat4.rotateY(m, m, deg2rad(x))
        mat4.mul(m, m, backFromRotationCenter)
        mat4.mul(m, this._camera!, m)
        this.context.camera.value = m

        this.context.invalidate()
    }

    override pointerup(ev: PointerEvent): void {
        if (this._down === undefined) {
            return
        }
        ev.preventDefault()
        this._down = undefined
        // this._camera = undefined
    }
}
