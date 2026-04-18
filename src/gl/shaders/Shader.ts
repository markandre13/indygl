import type { Device } from "../Device"

export class Shader {
    device: Device
    module: GPUShaderModule
    // pipeline: GPURenderPipeline
    constructor(device: Device, code: string) {
        this.device = device
        this.module = this.device.device.createShaderModule({ code })
        this.module.getCompilationInfo().then(info => logCompilationInfo(info))
    }
}

export async function logCompilationInfo(info: GPUCompilationInfo) {
    for (let m of info.messages) {
        const l = `${m.lineNum}:${m.linePos}: ${m.message}`
        switch (m.type) {
            case "error":
                console.error(l)
                break
            case "warning":
                console.warn(l)
                break
            case "info":
                console.info(l)
                break
        }
    }
}