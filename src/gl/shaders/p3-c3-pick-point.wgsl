struct SceneUniforms { 
    uProjectionMatrix: mat4x4f,
    camera: vec4f,
    scale: vec2f,
};
struct ModelUniforms { 
    uModelViewMatrix: mat4x4f,
    uNormalMatrix: mat4x4f,
};
@group(0) @binding(0) var<uniform> sceneUniforms: SceneUniforms;
@group(0) @binding(1) var<uniform> modelUniforms: ModelUniforms;

struct VSOutput {
    @builtin(position) Position: vec4f,
    @location(0) color: vec4f,
}

@vertex
fn vertex_main(
    @location(0) vert: vec3f,
    @builtin(vertex_index) vNdx: u32,
    @builtin(instance_index) iNdx: u32,
) -> VSOutput {
    // rectangle to draw the pick point
    let rectangle = array(
        vec2f(-1, -1), vec2f( 1, -1), vec2f(-1,  1),
        vec2f(-1,  1), vec2f( 1, -1), vec2f( 1,  1),
    );
    // position of the vertex on screen
    let indexPos = sceneUniforms.uProjectionMatrix * modelUniforms.uModelViewMatrix * vec4(vert, 1);
    // position of a point of the rectangle to draw for the pick point
    let pointPos = vec4f(rectangle[vNdx] * sceneUniforms.scale * indexPos.w, 0, 0) + indexPos;

    // encode instance index as rgb color
    let i = iNdx + 1;
    let r = f32(i & 0xff) / 255;
    let g = f32((i>>8) & 0xff) / 255;
    let b = f32((i>>16) & 0xff) / 255;
    return VSOutput(pointPos, vec4f(r, g, b, 1));
}

@fragment
fn fragment_main(
    vin: VSOutput
) -> @location(0) vec4f {
    return vin.color;
}