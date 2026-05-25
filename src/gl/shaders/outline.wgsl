// https://webgpufundamentals.org/webgpu/lessons/webgpu-highlighting.html

struct VSOutput {
  @builtin(position) position: vec4f,
  @location(0) texcoord: vec2f,
};
 
@vertex fn vs(
  @builtin(vertex_index) vertexIndex : u32,
) -> VSOutput {
  var pos = array( // ????
    vec2f(-1.0, -1.0),
    vec2f(-1.0,  3.0),
    vec2f( 3.0, -1.0),
  );
 
  var vsOutput: VSOutput;
  let xy = pos[vertexIndex];
  vsOutput.position = vec4f(xy, 0.0, 1.0);
  vsOutput.texcoord = xy * vec2f(0.5, -0.5) + vec2f(0.5);
  return vsOutput;
}
 
@group(0) @binding(0) var mask: texture_2d<f32>;
 
fn isObjectNearby(pos: vec2i) -> bool {
  // Note: we need to make sure we don't use out of bounds
  // texel coordinates with textureLoad as that returns
  // different results on different GPUs
  let size = vec2i(textureDimensions(mask, 0));
  let start = max(pos - 2, vec2i(0));
  let end = min(pos + 2, size);
 
  for (var y = start.y; y <= end.y; y++) {
    for (var x = start.x; x <= end.x; x++) {
      let s = textureLoad(mask, vec2i(x, y), 0).a;
      if (s > 0) {
        return true;
      }
    }
  }
  return false;
};
 
@fragment fn fs2d(fsInput: VSOutput) -> @location(0) vec4f {
  let pos = vec2i(fsInput.position.xy);
 
  // Get the current texel.
  // If it's not 0 we're inside the selected objects
  let areWeInsideTheObject = textureLoad(mask, pos, 0).a;
  if (areWeInsideTheObject > 0) {
    discard;
  }
 
  let isNearBy = isObjectNearby(pos);
  if (!isNearBy) {
    discard;
  }
  return vec4f(1, 0.5, 0, 1); // orange
}