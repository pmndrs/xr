import type { XRElementImplementations, XRState, XRStore } from './store.js'

export function setupSyncIsVisible(
  store: XRStore<XRElementImplementations>,
  setIsVisible: (visible: boolean) => void,
): () => void {
  const update = (state: XRState<XRElementImplementations>, prevState?: XRState<XRElementImplementations>) => {
    if (prevState != null && state.visibilityState === prevState.visibilityState) {
      return
    }
    setIsVisible(state.visibilityState === 'visible')
  }
  update(store.getState())
  return store.subscribe(update)
}
