import { Signal } from 'toad.js/reactive/Signal'
import type { Root } from './nodes/IndyNode'

export class NodeTree {
    signal = new Signal()
    root!: Root
}
