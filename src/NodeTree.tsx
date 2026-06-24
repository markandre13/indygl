import { Signal } from 'toad.js/reactive/Signal'
import type { Context } from './gl/Context'
import { Root } from './nodes/Root'


export class NodeTree {
    signal = new Signal()

    root!: Root

}
