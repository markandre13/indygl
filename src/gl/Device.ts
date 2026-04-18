export class Device {
    adapter!: GPUAdapter;
    device!: GPUDevice

    constructor() {
        if (!navigator.gpu) {
            throw Error('No WebGPU')
        }
    }

    async init() {
        const adapter = await navigator.gpu!.requestAdapter({ featureLevel: 'core' })
        if (adapter === null) {
            throw Error('failed to allocate GPUAdapter')
        }
        this.adapter = adapter
        this.device = await this.adapter.requestDevice()
        if (this.device === undefined) {
            throw Error('failed to allocate `GPUDevice')
        }
        // uncaught errors
        this.device.addEventListener('uncapturederror', event => console.log(event.error))
    }
}
