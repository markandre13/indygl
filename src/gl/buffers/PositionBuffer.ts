import type { GPUVertexDef } from "./GPUVertexDef"
import { FLOAT32_NUM_BYTES } from "./sizeof"
import { VertexBuffer } from "./VertexBuffer"


export class PositionBuffer extends VertexBuffer {
    bytesPerVertex: number = FLOAT32_NUM_BYTES * 3;
    position: GPUVertexDef = { offset: FLOAT32_NUM_BYTES * 0, format: 'float32x3' };
}
