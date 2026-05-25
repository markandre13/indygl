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
// @group(2) @binding(0) var<uniform> colorUniforms: ColorUniforms;

struct Vertex2Fragment {
    @builtin(position) Position: vec4f,
    @location(0) rgb: vec4f
}

@vertex
fn vertex_main(
    @location(0) position: vec4f,
    @builtin(instance_index) iNdx: u32
) -> Vertex2Fragment {

    let gl_Position 
        = sceneUniforms.uProjectionMatrix 
        * modelUniforms.uModelViewMatrix 
        * position;

    // encode instance index as rgb color
    let i = iNdx + 1;
    let r = f32(i & 0xff) / 255;
    let g = f32((i>>8) & 0xff) / 255;
    let b = f32((i>>16) & 0xff) / 255;

    return Vertex2Fragment(gl_Position, vec4f(r, g, b, 1));
}

@fragment
fn fragment_main(
    vin: Vertex2Fragment
) -> @location(0) vec4f {
    return vin.rgb;
}