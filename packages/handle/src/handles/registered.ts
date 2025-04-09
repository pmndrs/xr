import { Group } from 'three'
import { HandleStore, HandleOptions } from '../store.js'
import { HandlesContext } from './context.js'
import { extractHandleTransformOptions } from './utils.js'

export class RegisteredHandle extends Group {
  public readonly store: HandleStore<unknown>
  protected options: Exclude<ReturnType<typeof extractHandleTransformOptions>, false> | undefined
  protected readonly tag: string

  constructor(
    protected readonly context: HandlesContext,
    protected readonly axis: 'x' | 'y' | 'z' | 'xy' | 'yz' | 'xz' | 'xyz' | 'e',
    tagPrefix: string,
    getOptions: () => HandleOptions<unknown>,
  ) {
    super()
    this.tag = (tagPrefix ?? '') + axis
    this.store = new HandleStore(context.target, () => context.getHandleOptions(this.tag, getOptions))
  }
}
