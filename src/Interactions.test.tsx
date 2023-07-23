import { describe, it, expect, vi } from 'vitest'
import { render } from './testUtils/testUtilsThree'
import * as React from 'react'
import { createStoreMock, createStoreProvider } from './mocks/storeMock'
import { InteractionManager, Interactive } from './Interactions'
import { XRControllerMock } from './mocks/XRControllerMock'
import { act } from '@react-three/test-renderer'
import { XRInputSourceMock } from './mocks/XRInputSourceMock'
import { Intersection } from '@react-three/fiber'
import { Vector3 } from 'three'

describe('Interactions', () => {
  it('should call onSelect when select event is dispatched', async () => {
    const store = createStoreMock()
    const xrControllerMock = new XRControllerMock(0)
    const xrInputSourceMock = new XRInputSourceMock({ handedness: 'right' })
    xrControllerMock.inputSource = xrInputSourceMock
    const rightHoverState = new Map()
    store.setState({
      controllers: [xrControllerMock],
      hoverState: {
        none: new Map(),
        left: new Map(),
        right: rightHoverState
      }
    })

    const selectSpy = vi.fn()
    const { renderer } = await render(
      <InteractionManager>
        <Interactive onSelect={selectSpy}>
          <mesh position={[0, 0, -1]}>
            <planeGeometry args={[1, 1]} />
          </mesh>
        </Interactive>
      </InteractionManager>,
      { wrapper: createStoreProvider(store) }
    )

    const mesh = renderer.scene.findByType('Mesh').instance
    const interactiveGroup = renderer.scene.findByType('Group').instance
    expect(mesh).toBeDefined()
    expect(interactiveGroup).toBeDefined()
    const intersection: Intersection = {
      eventObject: mesh,
      distance: 1,
      point: new Vector3(0, 0, 0),
      object: mesh
    }

    rightHoverState.set(mesh, intersection)
    rightHoverState.set(interactiveGroup, intersection)

    await act(async () => {
      xrControllerMock.controller.dispatchEvent({ type: 'select', data: {} })
    })

    expect(selectSpy).toBeCalled()
  })
})
