
export class IndexBuffer {
    buffer: GPUBuffer
    private _length: number
    constructor(device: GPUDevice, indices: ArrayLike<number>) {
        this._length = indices.length
        this.buffer = device.createBuffer({
            label: 'indexbuffer',
            size: indices.length * 4,
            usage: GPUBufferUsage.INDEX,
            mappedAtCreation: true,
        })
        new Uint32Array(this.buffer.getMappedRange()).set(indices)
        this.buffer.unmap()
    }
    get length() {
        return this._length
    }
}
