import { describe, expect, it, vi } from 'vitest'
import { renderHook } from './testUtils/testUtilsDom'
import { useXREvent } from './XREvents'
import { createStoreMock, createStoreProvider } from './mocks/storeMock'
import { XRControllerMock } from './mocks/XRControllerMock'

describe('XREvents', () => {
  it('should not call callback if no events happened', async () => {
    const selectSpy = vi.fn()
    const store = createStoreMock()

    await renderHook(() => useXREvent('select', selectSpy), {
      wrapper: createStoreProvider(store)
    })

    expect(selectSpy).not.toBeCalled()
  })

  it('should call callback with custom data including native event and target when xr event is dispatched', async () => {
    const selectSpy = vi.fn()
    const store = createStoreMock()
    const xrControllerMock = new XRControllerMock(0)
    store.setState({
      controllers: [xrControllerMock]
    })

    await renderHook(() => useXREvent('select', selectSpy), {
      wrapper: createStoreProvider(store)
    })
    xrControllerMock.controller.dispatchEvent({ type: 'select' })

    expect(selectSpy).toBeCalledTimes(1)
    expect(selectSpy).toBeCalledWith(
      expect.objectContaining({
        nativeEvent: expect.objectContaining({ type: 'select' }),
        target: xrControllerMock
      })
    )
  })
})
