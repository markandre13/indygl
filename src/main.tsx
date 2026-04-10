import { cubeData, type TypedArrayConstructor, type TypedArrayView } from './geom-cube'
import { VertexBuffer } from './gl/VertexBuffer'
import { Texture } from "./gl/Texture"
import { Uniform } from './gl/Uniform'
import { mat4, vec3 } from 'gl-matrix'

// stuff to investigate
// * resize canvas
// * draw via index
// * hide more boilerplate code

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

enum UniformIndex {
    PROJECTION = 0,
    MODELVIEW,
    NORMAL
}

async function main() {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
    if (canvas === null) {
        throw Error("#canvas not found")
    }

    //
    // get GPU
    //

    const adapter = await navigator.gpu?.requestAdapter({ featureLevel: 'core' })
    const device = await adapter?.requestDevice()
    if (device == null) {
        throw Error('context == null')
    }
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

    const depthTextureFormat = 'depth24plus'
    const depthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: depthTextureFormat,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    })

    const uniforms = new Uniform(device, ["mat4x4f", "mat4x4f", "mat4x4f"])

    // Fetch the image and upload it into a GPUTexture.
    const cubeTexture = new Texture()
    await cubeTexture.load(device, "Di-3d.png")

    // Create a sampler with linear filtering for smooth interpolation of the texture
    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
    })

    const xyz = new VertexBuffer(device, cubeData.vertices)

    // SYSTEM PART

    const module = device.createShaderModule({
        code: /* wgsl */`
        struct Uniforms { 
            uProjectionMatrix: mat4x4f,
            uModelViewMatrix: mat4x4f,
            uNormalMatrix: mat4x4f,
        }
        @group(0) @binding(0) var<uniform> uniforms: Uniforms;
        @group(0) @binding(1) var mySampler: sampler;
        @group(0) @binding(2) var myTexture: texture_2d<f32>;
    
        struct Vertex2Fragment {
            @builtin(position) Position: vec4f,
            @location(0) fragUV: vec2f,
            @location(1) vLighting: vec3f
        }

        @vertex
        fn vertex_main(
            @location(0) position: vec4f,
            @location(1) normal: vec4f,
            @location(2) uv: vec2f
        ) -> Vertex2Fragment {

            let gl_Position = uniforms.uProjectionMatrix * uniforms.uModelViewMatrix * position;

            let ambientLight = vec3f(0.3, 0.3, 0.3);
            let directionalLightColor = vec3f(1, 1, 1);
            let directionalVector = normalize(vec3f(0.85, 0.8, 0.75));

            let transformedNormal = uniforms.uNormalMatrix * vec4f(normal.xyz, 1);

            let directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
            let vLighting = ambientLight + (directionalLightColor * directional);

            return Vertex2Fragment(
                gl_Position,
                uv,
                vLighting
            );
        }

        @fragment
        fn fragment_main(
            vin: Vertex2Fragment
        ) -> @location(0) vec4f {
            // let color = vec3f(1, 0.5, 0);
            let color = textureSample(myTexture, mySampler, vin.fragUV).rgb;
            return vec4f(color * vin.vLighting, 1);
        }
    `})
    async function logMessages(module: GPUShaderModule | undefined) {
        if (module === undefined) {
            return
        }
        const info = await module.getCompilationInfo()
        for (let m of info.messages) {
            const l = `${name}: ${m.lineNum}:${m.linePos}: ${m.message}`
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
    await logMessages(module)

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
            // "line-list" | "line-strip" | "point-list" | "triangle-list" | "triangle-strip";
            topology: 'triangle-list',
            cullMode: 'back',
        },
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: depthTextureFormat,
        },
    }

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

    let cubeRotation = 0

    // like my OpenGL
    const fieldOfView = (45 * Math.PI) / 180 // in radians
    const aspect = canvas.clientWidth / canvas.clientHeight
    const zNear = 0.1
    const zFar = 100.0
    mat4.perspectiveZO(uniforms.values[UniformIndex.PROJECTION], fieldOfView, aspect, zNear, zFar)

    let lastFrameMS = Date.now()

    function frame() {
        const now = Date.now()
        const deltaTime = (now - lastFrameMS) / 1000
        cubeRotation += deltaTime
        lastFrameMS = now

        const modelViewMatrix = uniforms.values[UniformIndex.MODELVIEW]
        mat4.identity(modelViewMatrix)
        mat4.translate(modelViewMatrix, modelViewMatrix, vec3.fromValues(0, 0, -6))
        mat4.rotateZ(modelViewMatrix, modelViewMatrix, cubeRotation)
        mat4.rotateY(modelViewMatrix, modelViewMatrix, cubeRotation * 0.7)
        mat4.rotateX(modelViewMatrix, modelViewMatrix, cubeRotation * 0.3)

        const normalMatrix = uniforms.values[UniformIndex.NORMAL]
        mat4.invert(normalMatrix, modelViewMatrix)
        mat4.transpose(normalMatrix, normalMatrix)

        // how do we do multiple operations? what can be re-used?

        uniforms.writeTo(device!.queue)

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