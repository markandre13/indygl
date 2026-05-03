import { mat4 } from 'gl-matrix'
import { ValueModel, type ValueModelOptions, VALUE } from 'toad.js/appkit/ValueModel'
import { deg2rad } from './algorithms/deg2rad'
import { euler2matrix } from './algorithms/euler'

export class Mat4Model extends ValueModel<mat4> {
    constructor(value?: mat4, options?: ValueModelOptions<mat4>) {
        if (value === undefined) {
            value = mat4.create()
        } else {
            value = mat4.clone(value)
        }
        super(value, options)
    }

    override resetToDefault() {
        if (this.default) {
            this._value = mat4.clone(this.default)
        } else {
            mat4.identity(this._value)
        }
        this.signal.emit({ type: VALUE })
    }
    rotateTo(x: number, y: number, z: number) {
        const justTranslation = mat4.clone(this._value)
        // just rotation
        justTranslation[12] = justTranslation[13] = justTranslation[14] = 0
        // inverse rotation
        mat4.invert(justTranslation, justTranslation)
        // just translation
        mat4.mul(justTranslation, justTranslation, this._value)

        const newRotation = euler2matrix(deg2rad(x), deg2rad(y), deg2rad(z))

        this.value = mat4.mul(newRotation, newRotation, justTranslation)
    }
}
