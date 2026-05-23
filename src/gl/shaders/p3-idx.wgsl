struct SceneUniforms { 
    uProjectionMatrix: mat4x4f
};
struct ModelUniforms { 
    uModelViewMatrix: mat4x4f,
    uNormalMatrix: mat4x4f,
};
struct ColorUniforms {
    uColor: vec4f
}
@group(0) @binding(0) var<uniform> sceneUniforms: SceneUniforms;
@group(1) @binding(0) var<uniform> modelUniforms: ModelUniforms;
@group(2) @binding(0) var<uniform> colorUniforms: ColorUniforms;

struct Vertex2Fragment {
    @builtin(position) Position: vec4f,
}

@vertex
fn vertex_main(
    @location(0) position: vec4f,
    @location(1) normal: vec4f,
) -> Vertex2Fragment {

    let gl_Position 
        = sceneUniforms.uProjectionMatrix 
        * modelUniforms.uModelViewMatrix 
        * position;

    return Vertex2Fragment(gl_Position);
}

@fragment
fn fragment_main(
    vin: Vertex2Fragment
) -> @location(0) vec4f {
    return colorUniforms.uColor;
}