import { type ReadonlyVec3, vec3 } from "gl-matrix"

/**
 * Finds the nearest points between two 3D lines
 *
 * @param originA - Point on line A
 * @param directionA - Direction vector of line A
 * @param originB - Point on line B
 * @param directionB - Direction vector of line B
 * @returns Object containing:
 *   - a: parameter for closest point on line A (originA + a * directionA)
 *   - b: parameter for closest point on line B (originB + b * directionB)
 *   - distance: minimum distance between the lines
 */
export function nearestPointBetweenLines(
    originA: ReadonlyVec3, 
    directionA: ReadonlyVec3, 
    originB: ReadonlyVec3, 
    directionB: ReadonlyVec3
): { a: number; b: number; distance: number } {
    // https://en.wikipedia.org/wiki/Skew_lines#Distance_between_two_skew_lines
    const u = directionA
    const v = directionB
    const w = vec3.sub(vec3.create(), originA, originB)
    
    const a = vec3.dot(u, u)  // always >= 0
    const b = vec3.dot(u, v)
    const c = vec3.dot(v, v)  // always >= 0
    const d = vec3.dot(u, w)
    const e = vec3.dot(v, w)
    const den = a * c - b * b  // always >= 0
    
    let s, t
    if (den < 1e-10) {
        // Lines are parallel or one direction is zero
        if (a < 1e-10 && c < 1e-10) {
            // Both directions are zero - lines are just points
            s = 0.0
            t = 0.0
        } else if (a < 1e-10) {
            // Line A is just a point
            s = 0.0
            t = e / c
        } else if (c < 1e-10) {
            // Line B is just a point
            s = d / a
            t = 0.0
        } else {
            // Lines are parallel
            s = 0.0
            t = (b > c ? e / b : d / a)
        }
    } else {
        s = (b * e - c * d) / den
        t = (a * e - b * d) / den
    }
    
    const distance = vec3.len(vec3.sub(vec3.create(), 
        vec3.add(vec3.create(), originA, vec3.scale(vec3.create(), directionA, s)),
        vec3.add(vec3.create(), originB, vec3.scale(vec3.create(), directionB, t))
    ))
    
    return { a: s, b: t, distance }
}