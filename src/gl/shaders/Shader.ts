export class Shader {
    module: GPUShaderModule
    constructor(module: GPUShaderModule) {
        this.module = module
        module.getCompilationInfo().then(info => logCompilationInfo(info))
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