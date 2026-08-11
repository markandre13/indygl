import type { Context } from "../../Context"
import { ShaderP3_C3_IDX } from "../ShaderP3_C3_IDX"

export class ShaderP3_C3_IDX_LineList extends ShaderP3_C3_IDX {
    constructor(context: Context) {
        super(context, 'none', 'line-list')
    }
}
