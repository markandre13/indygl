import type { GPUVertexDef } from "./GPUVertexDef"
import { FLOAT32_NUM_BYTES } from "./sizeof"
import { VertexBuffer } from "./VertexBuffer"

// FIXME: Uint8Array instead of Float32???
export class ColorBuffer extends VertexBuffer {
    static bytesPerVertex: number = FLOAT32_NUM_BYTES * 3;
    static color: GPUVertexDef = { offset: FLOAT32_NUM_BYTES * 0, format: 'float32x3' };
}
