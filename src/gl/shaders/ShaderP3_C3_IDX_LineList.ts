import type { CanvasContext } from "../CanvasContext"
import type { Device } from "../Device"
import { ShaderP3_C3_IDX } from "./ShaderP3_C3_IDX"

export class ShaderP3_C3_IDX_LineList extends ShaderP3_C3_IDX {
    constructor(device: Device, context: CanvasContext) {
        super(device, context, 'none', 'line-list', 'less')
    }
}
