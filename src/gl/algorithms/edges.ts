import type { MeshData } from "./MeshData"

export function edges(data: MeshData, offset: number, length: number): ArrayLike<number> {
    if (!data.fxyz || !data.vcount) {
        throw Error()
    }
    const edges: number[] = []
    const knownEdges = new Map<number, Set<number>>()

    function edge(e0: number, e1: number) {
        let m0 = knownEdges.get(e0)
        let m1 = knownEdges.get(e1)
        if (m0 === undefined && m1 === undefined) {
            edges.push(e0, e1)
            knownEdges.set(e0, new Set([e1]))
            return
        }
        if (m0 === undefined) {
            [m0, m1] = [m1, m0];
            [e0, e1] = [e1, e0]
        }
        if (m0!.has(e1)) {
            return
        }
        m0!.add(e1)
        edges.push(e0, e1)
    }
    let fp = 0
    // console.log(`edges(..., offset=${offset}, length=${length})`)
    for (let i = offset; length > 0; ++i) {
        const n = data.vcount[i]
        length -= n
        const el = data.fxyz[fp++]
        let e0 = el
        for(let i=1; i<n; ++i) {
            let e1 = data.fxyz[fp++]
            edge(e0, e1)
            e0 = e1
        }
        edge(e0, el)
    }
    return edges
}