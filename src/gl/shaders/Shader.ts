import type { Device } from "../Device"
import outline from "./outline.wgsl"
import p3_idx from "./p3-idx.wgsl"
import p3_idx_id from "./p3-idx-id.wgsl"
import p3_n3_idx from "./p3-n3-idx.wgsl"
import p3_n3_t2_idx from "./p3-n3-t2-idx.wgsl"

const modules = new Map<string, GPUShaderModule>()

export class Shader {
    device: Device
    module: GPUShaderModule
    constructor(device: Device, label: string) {
        this.device = device
        let module = modules.get(label)
        if (module === undefined) {
            let code: string
            switch(label) {
                case 'outline': code = outline; break
                case 'p3-idx': code = p3_idx; break
                case 'p3-idx-id': code = p3_idx_id; break
                case 'p3-n3-idx': code = p3_n3_idx; break
                case 'p3-n3-t2-idx': code = p3_n3_t2_idx; break
                default: throw Error('yikes')
            }
            module = this.device.device.createShaderModule({ label, code })
            module.getCompilationInfo().then(info => logCompilationInfo(info))
        }
        this.module = module       
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