import * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { createStoreMock, createStoreProvider } from './mocks/storeMock'
import { render } from './testUtils/testUtilsThree'
import { Controllers } from './Controllers'
import { XRControllerMock } from './mocks/XRControllerMock'
import { XRControllerModel } from './XRControllerModel'
import { XRControllerModelFactoryMock } from './mocks/XRControllerModelFactoryMock'
import { XRInputSourceMock } from './mocks/XRInputSourceMock'
import { act } from '@react-three/test-renderer'

vi.mock('./XRControllerModelFactory', async () => {
  const { XRControllerModelFactoryMock } = await vi.importActual<typeof import('./mocks/XRControllerModelFactoryMock')>(
    './mocks/XRControllerModelFactoryMock'
  )
  return { XRControllerModelFactory: XRControllerModelFactoryMock }
})

describe('Controllers', () => {
  it('should not render anything if controllers in state are empty', async () => {
    const store = createStoreMock()
    const xrControllerMock = new XRControllerMock(0)
    store.setState({ controllers: [] })

    const { renderer } = await render(<Controllers />, { wrapper: createStoreProvider(store) })

    // We aren't rendering anything as a direct children, only in portals
    const graph = renderer.toGraph()
    expect(graph).toHaveLength(0)
    // Checking portals
    expect(xrControllerMock.grip.children).toHaveLength(0)
    expect(xrControllerMock.controller.children).toHaveLength(0)
  })

  it('should render one xr controller model and one ray given one controller in state', async () => {
    const store = createStoreMock()
    const xrControllerMock = new XRControllerMock(0)
    store.setState({ controllers: [xrControllerMock] })

    await render(<Controllers />, { wrapper: createStoreProvider(store) })

    // Checking portals
    expect(xrControllerMock.grip.children).toHaveLength(1)
    expect(xrControllerMock.grip.children[0]).toBeInstanceOf(XRControllerModel)
    expect(xrControllerMock.controller.children).toHaveLength(1)
    expect(xrControllerMock.controller.children[0].type).toBe('Line')
  })

  it('should render two xr controller models and two rays given one controller in state', async () => {
    const store = createStoreMock()
    const xrControllerMockLeft = new XRControllerMock(0)
    const xrControllerMockRight = new XRControllerMock(1)
    store.setState({ controllers: [xrControllerMockLeft, xrControllerMockRight] })

    await render(<Controllers />, { wrapper: createStoreProvider(store) })

    // Checking portals
    // left
    expect(xrControllerMockLeft.grip.children).toHaveLength(1)
    expect(xrControllerMockLeft.grip.children[0]).toBeInstanceOf(XRControllerModel)
    expect(xrControllerMockLeft.controller.children).toHaveLength(1)
    expect(xrControllerMockLeft.controller.children[0].type).toBe('Line')
    // right
    expect(xrControllerMockRight.grip.children).toHaveLength(1)
    expect(xrControllerMockRight.grip.children[0]).toBeInstanceOf(XRControllerModel)
    expect(xrControllerMockRight.controller.children).toHaveLength(1)
    expect(xrControllerMockRight.controller.children[0].type).toBe('Line')
  })

  it('should remove xr controller model when controller is removed from state', async () => {
    const store = createStoreMock()
    const xrControllerMock = new XRControllerMock(0)
    xrControllerMock.inputSource = new XRInputSourceMock()
    store.setState({ controllers: [xrControllerMock] })

    const { renderer } = await render(<Controllers />, { wrapper: createStoreProvider(store) })

    await act(async () => {
      store.setState({ controllers: [] })
    })

    // We aren't rendering anything as a direct children, only in portals
    const graph = renderer.toGraph()
    expect(graph).toHaveLength(0)
    // Checking portals
    expect(xrControllerMock.grip.children).toHaveLength(0)
    expect(xrControllerMock.controller.children).toHaveLength(0)
  })

  it('should handle xr controller model given one controller in state', async () => {
    const store = createStoreMock()
    const xrControllerMock = new XRControllerMock(0)
    xrControllerMock.inputSource = new XRInputSourceMock()
    store.setState({ controllers: [xrControllerMock] })

    await render(<Controllers />, { wrapper: createStoreProvider(store) })

    const xrControllerModelFactory = XRControllerModelFactoryMock.instance
    expect(xrControllerModelFactory).toBeDefined()
    expect(xrControllerMock.xrControllerModel).toBeInstanceOf(XRControllerModel)
    expect(xrControllerModelFactory?.initializeControllerModel).toBeCalled()
  })

  it('should handle xr controller model when controller is removed from state', async () => {
    const store = createStoreMock()
    const xrControllerMock = new XRControllerMock(0)
    xrControllerMock.inputSource = new XRInputSourceMock()
    store.setState({ controllers: [xrControllerMock] })

    await render(<Controllers />, { wrapper: createStoreProvider(store) })

    const xrControllerModel = xrControllerMock.xrControllerModel
    const disconnectSpy = vi.spyOn(xrControllerModel!, 'disconnect')

    await act(async () => {
      store.setState({ controllers: [] })
    })

    const xrControllerModelFactory = XRControllerModelFactoryMock.instance
    expect(xrControllerModelFactory).toBeDefined()
    expect(xrControllerMock.xrControllerModel).toBeNull()
    expect(disconnectSpy).toBeCalled()
  })
})
