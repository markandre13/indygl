import { mat4 } from "gl-matrix"
import { Rot3Model } from "./Rot3Model"
import { Scale3Model } from "./Scale3Model"
import { Vec3Model } from "./Vec3Model"
import { Signal } from "toad.js/reactive/Signal"
import { deg2rad } from "src/gl/algorithms/deg2rad"

export class TransformModel {
    readonly signal = new Signal()
    readonly translation = new Vec3Model();
    readonly rotation = new Rot3Model();
    readonly scale = new Scale3Model();
    readonly dimensions = new Vec3Model();
    private readonly m = mat4.create()

    private emit() { this.signal.emit() }
    constructor() {
        this.emit = this.emit.bind(this)
        this.translation.signal.add(this.emit)
        this.rotation.signal.add(this.emit)
        this.scale.signal.add(this.emit)
        // TODO: dimensions, which is to affect scale relative to the current object's dimensions
        // TODO: how to we get the dimensions?
    }

    get value(): mat4 {
        mat4.identity(this.m)
        mat4.translate(this.m, this.m, this.translation.value)
        mat4.rotateX(this.m, this.m, deg2rad(this.rotation.x.value.toNumber()))
        mat4.rotateY(this.m, this.m, deg2rad(this.rotation.y.value.toNumber()))
        mat4.rotateZ(this.m, this.m, deg2rad(this.rotation.z.value.toNumber()))
        mat4.scale(this.m, this.m, this.scale.value)
        return this.m
    }

}

