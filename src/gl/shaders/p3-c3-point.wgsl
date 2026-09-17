struct SceneUniforms { 
    uProjectionMatrix: mat4x4f,
    camera: vec4f,
    scale: vec2f,
};
struct ModelUniforms { 
    uModelViewMatrix: mat4x4f,
    uNormalMatrix: mat4x4f,
};
// struct PickUniforms { 
//     scale: vec2f,
// };
@group(0) @binding(0) var<uniform> sceneUniforms: SceneUniforms;
@group(1) @binding(0) var<uniform> modelUniforms: ModelUniforms;
// @group(2) @binding(0) var<uniform> pickUniforms: PickUniforms;

struct VSOutput {
    @builtin(position) Position: vec4f,
    @location(0) color: vec4f,
}

@vertex
fn vertex_main(
    @location(0) vert: vec3f,
    @location(1) color: vec3f,
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
    // TODO: do it proper
    // let color = vec4f(f32(iNdx) / 8.0, 0, 0, 1);
    return VSOutput(pointPos, vec4(color, 1));
}

@fragment
fn fragment_main(
    vin: VSOutput
) -> @location(0) vec4f {
    return vin.color;
}
