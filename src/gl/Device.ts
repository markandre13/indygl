export class Device {
    adapter: GPUAdapter | null = null;
    device: GPUDevice | undefined

    async init() {
        this.adapter = await navigator.gpu?.requestAdapter({ featureLevel: 'core' })
        if (this.adapter === null) {
            throw Error('failed to allocate GPUAdapter')
        }
        this.device = await this.adapter?.requestDevice()
        if (this.device === undefined) {
            throw Error('failed to allocate `GPUDevice')
        }
        // uncaught errors
        this.device.addEventListener('uncapturederror', event => console.log(event.error))
    }
}
