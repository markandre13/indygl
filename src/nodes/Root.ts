import type { Context } from "src/gl/Context"
import { IndyNode } from "./IndyNode"


export class Root extends IndyNode {
    constructor(context: Context) {
        super(undefined as any)
        this.context = context
    }
}
