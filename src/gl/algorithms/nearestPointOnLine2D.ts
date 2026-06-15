import type { Point } from "../types/Point"

/**
 * Find the point on line L := origin + a * direction which is nearest to point point.
 * 
 * @param point 
 * @param origin 
 * @param direction 
 */

export function nearestPointOnLine2D(
    point: Point,
    origin: Point,
    direction: Point,
): { a: number; p: Point}  { 
    // Handle degenerate case where direction is zero
    if (direction.x === 0 && direction.y === 0) {
        // Return the origin as the nearest point
        return { a: 0, p: { x: origin.x, y: origin.y } }
    }
    
    // Calculate parameter 'a' that minimizes distance
    // The nearest point on the line is where the vector from origin to point 
    // is perpendicular to the direction vector
    const dx = point.x - origin.x
    const dy = point.y - origin.y
    
    // Using dot product: (point - origin) · direction = a * (direction · direction)
    const dotProduct = dx * direction.x + dy * direction.y
    const directionDot = direction.x * direction.x + direction.y * direction.y
    
    // Solve for a: a = ((point - origin) · direction) / (direction · direction)
    const a = dotProduct / directionDot
    
    // Calculate the actual point on the line
    const px = origin.x + a * direction.x
    const py = origin.y + a * direction.y
    
    return { a, p: { x: px, y: py } }
}
