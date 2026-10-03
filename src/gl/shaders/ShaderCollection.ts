import type { Context } from '../Context'
import { ShaderFloor } from '../shaders/ShaderFloor'
import { ShaderOutline } from '../shaders/ShaderOutline'
import { ShaderP3_IDX } from '../shaders/ShaderP3_IDX'
import { ShaderP3_N3_IDX } from '../shaders/ShaderP3_N3_IDX'
import { ShaderP3_N3_T2_IDX } from '../shaders/ShaderP3_N3_T2_IDX'
import { ShaderP3C3_Line } from './ShaderP3C3_Line'
import { ShaderP3_C3_IDX } from './ShaderP3_C3_IDX'
import { ShaderP3_C3_Point } from './ShaderP3_C3_Point'
import { ShaderP3_IDX_Line } from './ShaderP3_IDX_Line'
import { ShaderP3_IDX_PickObject } from "./ShaderP3_IDX_PickObject"
import { ShaderP3_PickPoint } from './ShaderP3_PickPoint'

export class ShaderCollection {
    readonly floor: ShaderFloor
    readonly outline: ShaderOutline
    readonly p3_idx: ShaderP3_IDX
    readonly p3_idx_pick_object: ShaderP3_IDX_PickObject
    readonly p3_pick_point: ShaderP3_PickPoint
    readonly p3_idx_line: ShaderP3_IDX_Line
    readonly p3_n3_idx: ShaderP3_N3_IDX
    readonly p3_n3_t2_idx: ShaderP3_N3_T2_IDX
    readonly p3_c3_idx: ShaderP3_C3_IDX
    readonly p3_c3_point: ShaderP3_C3_Point
    readonly p3c3_line: ShaderP3C3_Line

    constructor(context: Context) {
        this.floor = new ShaderFloor(context)
        this.outline = new ShaderOutline(context)
        this.p3_idx = new ShaderP3_IDX(context)
        this.p3_idx_pick_object = new ShaderP3_IDX_PickObject(context, 'rgba8unorm')
        this.p3_pick_point = new ShaderP3_PickPoint(context)
        this.p3_idx_line = new ShaderP3_IDX_Line(context)
        this.p3_n3_idx = new ShaderP3_N3_IDX(context)
        this.p3_n3_t2_idx = new ShaderP3_N3_T2_IDX(context)
        this.p3_c3_idx = new ShaderP3_C3_IDX(context)
        this.p3_c3_point = new ShaderP3_C3_Point(context)
        this.p3c3_line = new ShaderP3C3_Line(context)
    }
}
