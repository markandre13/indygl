struct VSOutput {
    @builtin(position) position: vec4f,
    @location(0) texcoord: vec2f,
};

@vertex fn vs(
@builtin(vertex_index) vertexIndex : u32,
) -> VSOutput {
    var pos = array(
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

//  i32, u32, or f32
@group(0) @binding(0) var mask: texture_2d<u32>;

fn isOnEdge(pos: vec2i) -> u32 {
    // Note: we need to make sure we don't use out of bounds
    // texel coordinates with textureLoad as that returns
    // different results on different GPUs
    let size = vec2i(textureDimensions(mask, 0));
    let range = 1;
    let start = max(pos - range, vec2i(0));
    let end = min(pos + range, size);

    var edge = false;
    var count1: u32 = 0;
    var count2: u32 = 0;
    // var count3: u32 = 0; for active

    for (var y = start.y; y <= end.y; y++) {
        for (var x = start.x; x <= end.x; x++) {
            // textureLoad: Reads a single texel from a texture without sampling or filtering.
            let stencilValue = textureLoad(mask, vec2i(x, y), 0).r;
            switch(stencilValue & 3) {
                case 0: {
                    edge = true;
                }
                case 1: {
                    count1 = count1 + 1;
                }
                case 2: {
                    count2 = count2 + 1;
                }
                default: {}
            }
        }
    }
    if (!edge && !(count1 > 0 && count2 > 0)) {
        return 0;
    }
    if (count1 > count2) {
        return 1;
    }
    return 2;
};

@fragment fn fs2d(fsInput: VSOutput) -> @location(0) vec4f {
    // let pos = vec2i(fsInput.position.xy);
    // let t = textureLoad(mask, pos, 0);
    // var r = 0.0;
    // var g = 0.0;
    // var b = 0.0;

    // if ((t.r & 1) != 0) { r = 1.0; }
    // if ((t.r & 2) != 0) { g = 1.0; }
    // if ((t.r & 4) != 0) { b = 1.0; }

    // return vec4f(r, g, b, 1);

    let pos = vec2i(fsInput.position.xy);

    // get the current. If it's not 0 we're inside the selected objects
    let t = textureLoad(mask, pos, 0);
    let s = t.r;

    if (s==0) {
        discard;
    }

    var hit = isOnEdge(pos);

    let activeObject = vec4f(1, 0.627, 0.157, 1); // #ffa028
    let selectedObject = vec4f(0.929, 0.341, 0, 1); // #ed5700

    var alpha = 1.0;
    if ((s & 4) == 0) { alpha = 0.3; }

    switch(hit) {
        case 1: {
            return vec4f(activeObject.rgb, alpha);
        }
        case 2: {
            return vec4f(selectedObject.rgb, alpha);
        }
        default: {
            discard;
        }
    }
    return vec4f(0, 0.5, 0, 1);
}
