import { mat4, vec3 } from "gl-matrix"
import { IndyNode } from "./IndyNode"

export class XForm extends IndyNode {
    transform?: mat4

    override get origin(): vec3 | undefined {
        const origin = vec3.create()
        mat4.getTranslation(origin, this.combined)
        return origin
    }
}
