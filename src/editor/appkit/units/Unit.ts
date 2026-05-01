import BigNumber from "bignumber.js"

export interface Unit {
    symbol: string
    symbol2scale: Map<string, BigNumber>
}

export function makeUnit(def: [string, number][]): Unit {
    const s = def.filter(it => it[1] === 1.0)
    if (s.length === 0) {
        throw Error(`found no default unit of scale 1.0`)
    }
    const symbol = s[0][0]
    const symbol2scale = new Map(def.map(it => [it[0], BigNumber(it[1])]))
    return {symbol2scale, symbol}
}