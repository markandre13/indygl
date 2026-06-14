import type { Context } from "../Context"
import { ShaderP3_IDX } from "./ShaderP3_IDX"

export class ShaderP3_IDX_Line extends ShaderP3_IDX {
    constructor(context: Context) {
        super(context, 'p3-idx-line', 'line-list', 'none', 0, 0)
    }
}
