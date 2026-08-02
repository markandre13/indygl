import { Signal } from 'toad.js/reactive/Signal'
import { Root } from './nodes/Root'


export class NodeTree {
    signal = new Signal()
    root!: Root
}
