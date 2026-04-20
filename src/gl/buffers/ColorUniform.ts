import type { mat4, vec4 } from "gl-matrix"
import type { Device } from "../Device"
import { Uniform } from "./Uniform"


export class ColorUniform extends Uniform {
    constructor(device: Device) {
        super(device.device!!, ["vec4f"])
    }
    get rgba(): vec4 {
        return this.values[0]
    }
    set rgba(rgba: ArrayLike<number>) {
        this.values[0].set(rgba)
    }
}
