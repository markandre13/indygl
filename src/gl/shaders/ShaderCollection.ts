import type { Context } from '../Context'
import { ShaderFloor } from '../shaders/ShaderFloor'
import { ShaderOutline } from '../shaders/ShaderOutline'
import { ShaderP3_IDX } from '../shaders/ShaderP3_IDX'
import { ShaderP3_IDX_Id } from "../shaders/ShaderP3_IDX_Id"
import { ShaderP3_IDX_Line } from './ShaderP3_IDX_Line'
import { ShaderP3_N3_IDX } from '../shaders/ShaderP3_N3_IDX'
import { ShaderP3_N3_T2_IDX } from '../shaders/ShaderP3_N3_T2_IDX'
import { ShaderP3C3_Line } from './ShaderP3C3_Line'

export class ShaderCollection {
    readonly floor: ShaderFloor
    readonly outline: ShaderOutline
    readonly p3_idx: ShaderP3_IDX
    readonly p3_idx_id: ShaderP3_IDX_Id
    readonly p3_idx_line: ShaderP3_IDX_Line
    readonly p3_n3_idx: ShaderP3_N3_IDX
    readonly p3_n3_t2_idx: ShaderP3_N3_T2_IDX
    readonly p3c3_line: ShaderP3C3_Line

    constructor(context: Context) {
        this.floor = new ShaderFloor(context)
        this.outline = new ShaderOutline(context)
        this.p3_idx = new ShaderP3_IDX(context)
        this.p3_idx_id = new ShaderP3_IDX_Id(context)
        this.p3_idx_line = new ShaderP3_IDX_Line(context)
        this.p3_n3_idx = new ShaderP3_N3_IDX(context)
        this.p3_n3_t2_idx = new ShaderP3_N3_T2_IDX(context)
        this.p3c3_line = new ShaderP3C3_Line(context)
    }
}
