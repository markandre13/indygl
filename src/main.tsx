import { mat4, vec3 } from 'wgpu-matrix'
import { GUI } from 'dat.gui'
import { cubeData, type TypedArrayConstructor, type TypedArrayView } from './geom-cube'
// import cubeWGSL from './cube.wgsl';
import { ArcballCamera, WASDCamera } from './camera'
import { createInputHandler } from './input'
import { VertexBuffer } from './gl/VertexBuffer'
import { Matrix } from "./gl/Matrix"
import { Texture } from "./gl/Texture"
import { Uniform } from './gl/Uniform'

async function shadedCube(device: GPUDevice) {
    // prettier-ignore
    const vertexData = new Float32Array([
        // position       normal
        1, 1, -1, 1, 0, 0,
        1, 1, 1, 1, 0, 0,
        1, -1, 1, 1, 0, 0,
        1, -1, -1, 1, 0, 0,
        -1, 1, 1, -1, 0, 0,
        -1, 1, -1, -1, 0, 0,
        -1, -1, -1, -1, 0, 0,
        -1, -1, 1, -1, 0, 0,
        -1, 1, 1, 0, 1, 0,
        1, 1, 1, 0, 1, 0,
        1, 1, -1, 0, 1, 0,
        -1, 1, -1, 0, 1, 0,
        -1, -1, -1, 0, -1, 0,
        1, -1, -1, 0, -1, 0,
        1, -1, 1, 0, -1, 0,
        -1, -1, 1, 0, -1, 0,
        1, 1, 1, 0, 0, 1,
        -1, 1, 1, 0, 0, 1,
        -1, -1, 1, 0, 0, 1,
        1, -1, 1, 0, 0, 1,
        -1, 1, -1, 0, 0, -1,
        1, 1, -1, 0, 0, -1,
        1, -1, -1, 0, 0, -1,
        -1, -1, -1, 0, 0, -1,
    ])
    // prettier-ignore
    const indices = new Uint16Array([
        0, 1, 2, 0, 2, 3, // +x face
        4, 5, 6, 4, 6, 7, // -x face
        8, 9, 10, 8, 10, 11, // +y face
        12, 13, 14, 12, 14, 15, // -y face
        16, 17, 18, 16, 18, 19, // +z face
        20, 21, 22, 20, 22, 23, // -z face
    ])

    const vertexBuf = createBufferWithData(
        device,
        vertexData,
        GPUBufferUsage.VERTEX,
        'vertexBuffer'
    )
    const indicesBuf = createBufferWithData(
        device,
        indices,
        GPUBufferUsage.INDEX,
        'indexBuffer'
    )
}

console.log(`SIZE: ${cubeData.vertices.length}`)

async function main() {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
    if (canvas === null) {
        throw Error("#canvas not found")
    }

    // The input handler
    const inputHandler = createInputHandler(window, canvas)

    // The camera types
    const initialCameraPosition = vec3.create(3, 2, 5)
    const cameras = {
        arcball: new ArcballCamera({ position: initialCameraPosition }),
        WASD: new WASDCamera({ position: initialCameraPosition }),
    }

    const gui = new GUI()

    // GUI parameters
    const params: { type: 'arcball' | 'WASD' } = {
        type: 'arcball',
    }

    // Callback handler for camera mode
    let oldCameraType = params.type
    gui.add(params, 'type', ['arcball', 'WASD']).onChange(() => {
        // Copy the camera matrix from old to new
        const newCameraType = params.type
        cameras[newCameraType].matrix = cameras[oldCameraType].matrix
        oldCameraType = newCameraType
    })

    //
    // get GPU
    //

    const adapter = await navigator.gpu?.requestAdapter({
        featureLevel: 'compatibility',
    })
    const device = await adapter?.requestDevice()
    if (device == null) {
        throw Error('context == null')
    }
    // quitIfWebGPUNotAvailableOrMissingFeatures(adapter, device)
    const context = canvas.getContext('webgpu')
    if (context == null) {
        throw Error('no webgpu')
    }

    const devicePixelRatio = window.devicePixelRatio
    canvas.width = canvas.clientWidth * devicePixelRatio
    canvas.height = canvas.clientHeight * devicePixelRatio
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat()

    context.configure({
        device,
        format: presentationFormat,
    })

    const depthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    })

    const uniforms = new Uniform(device, ["mat4x4f", "mat4x4f", "mat4x4f", "mat4x4f"])

    // Fetch the image and upload it into a GPUTexture.
    const cubeTexture = new Texture()
    await cubeTexture.load(device, "Di-3d.png")

    // Create a sampler with linear filtering for smooth interpolation.
    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
    })

    const xyz = new VertexBuffer(device, cubeData.vertices)

    const module = device.createShaderModule({ code: /* wgsl */`
        struct Uniforms { 
            modelViewProjectionMatrix: mat4x4f,
            uNormalMatrix: mat4x4f,
            uModelViewMatrix: mat4x4f,
            uProjectionMatrix: mat4x4f,
        }
        @group(0) @binding(0) var<uniform> uniforms : Uniforms;
        @group(0) @binding(1) var mySampler: sampler;
        @group(0) @binding(2) var myTexture: texture_2d<f32>;
    
        struct VertexOutput {
            @builtin(position) Position: vec4f,
            @location(0) fragUV: vec2f,
            @location(1) normal: vec3f,
        }

        @vertex
        fn vertex_main(
            @location(0) position: vec4f,
            @location(1) normal: vec4f,
            @location(2) uv: vec2f
        ) -> VertexOutput {
            return VertexOutput(
                uniforms.modelViewProjectionMatrix * position,
                uv,
                normal.xyz
            );
        }

        @fragment
        fn fragment_main(
            @location(0) fragUV: vec2f,
            @location(1) normal: vec3f
        ) -> @location(0) vec4f {
            let lightDirection = normalize(vec3f(4, 10, 6));
            let light = dot(normalize(normal), lightDirection) * 0.5 + 0.5;
            let color = vec3f(1, 0.5, 0);

            return vec4f(color * light, 1);
            // return vec4f(1, 0.5, 0, 1);
            // return textureSample(myTexture, mySampler, fragUV);
        }
    `})

    const pipelineDef: GPURenderPipelineDescriptor = {
        layout: 'auto',
        vertex: {
            buffers: [{
                arrayStride: cubeData.bytesPerVertex,
                attributes: [
                    { shaderLocation: 0, ...cubeData.layout.POSITION },
                    { shaderLocation: 1, ...cubeData.layout.NORMAL },
                    { shaderLocation: 2, ...cubeData.layout.UV },
                ],
            }],
            module
        },
        fragment: {
            module,
            targets: [{ format: presentationFormat }]
        },
        primitive: {
            topology: 'triangle-list',
            cullMode: 'back',
        },
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus',
        },
    }
    async function logMessages(name: string, module: GPUShaderModule | undefined) {
        if (module === undefined) {
            return
        }
        const info = await module.getCompilationInfo()
        for(let m of info.messages) {
            const l = `${name}: ${m.lineNum}:${m.linePos}: ${m.message}`
            switch(m.type) {
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
    await logMessages("vertex  ", pipelineDef.vertex?.module)
    await logMessages("fragment", pipelineDef.fragment?.module)

    const pipeline = device.createRenderPipeline(pipelineDef)

    // define the values for shaders '@group(...) @binding(...)' sections
    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: uniforms },
            { binding: 1, resource: sampler },
            { binding: 2, resource: cubeTexture.texture!.createView() },
        ],
    })

    const renderPassDescriptor: GPURenderPassDescriptor = {
        colorAttachments: [
            {
                view: undefined as any, // Assigned later
                clearValue: [0.5, 0.5, 0.5, 1.0],
                loadOp: 'clear',
                storeOp: 'store',
            },
        ],
        depthStencilAttachment: {
            view: depthTexture.createView(),
            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        },
    }

    const aspect = canvas.width / canvas.height
    const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 1, 100.0)

    let lastFrameMS = Date.now()

    function frame() {
        const now = Date.now()
        const deltaTime = (now - lastFrameMS) / 1000
        lastFrameMS = now

        const modelViewMatrix = cameras[params.type].update(deltaTime, inputHandler())

        mat4.multiply(projectionMatrix, modelViewMatrix, uniforms.values[0])

        // THIS ONE
        uniforms.writeQueue(device!.queue)

        renderPassDescriptor.colorAttachments[0]!.view = context!
            .getCurrentTexture()
            .createView()

        const commandEncoder = device!.createCommandEncoder()

        const pass = commandEncoder.beginRenderPass(renderPassDescriptor)
        pass.setPipeline(pipeline)
        pass.setBindGroup(0, bindGroup)
        pass.setVertexBuffer(0, xyz.buffer)
        pass.draw(cubeData.vertexCount)
        pass.end()

        device!.queue.submit([commandEncoder.finish()])

        requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)

}

main()

function createBufferWithData(
    device: GPUDevice,
    data: TypedArrayView,
    usage: GPUBufferUsageFlags,
    label: string
) {
    const buffer = device.createBuffer({
        label,
        size: data.byteLength,
        usage,
        mappedAtCreation: true,
    })
    const Ctor = data.constructor as TypedArrayConstructor
    // map gpubuffer
    const dst = new Ctor(buffer.getMappedRange())
    // copy data into it
    dst.set(data)
    // unmap gpubuffer
    buffer.unmap()
    return buffer
}