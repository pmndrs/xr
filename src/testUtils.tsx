import { expect } from 'vitest'
import { act, create, ReactTestRenderer, ReactTestRendererJSON } from 'react-test-renderer'
import { createRef, useEffect } from 'react'
import * as React from 'react'

/**
 * Got this from vitest react example
 * @see https://vitest.dev/guide/#examples
 */
function toJson(component: ReactTestRenderer) {
  const result = component.toJSON()
  expect(result).toBeDefined()
  expect(result).not.toBeInstanceOf(Array)
  return result as ReactTestRendererJSON
}

/**
 * Hack to make async effects affect render
 * @see https://stackoverflow.com/a/70926194
 */
export async function render(
  element: React.ReactElement,
  {
    wrapper: WrapperComponent
  }: { wrapper?: React.FunctionComponent<React.PropsWithChildren> | React.ComponentClass<React.PropsWithChildren> } = {}
) {
  let root: ReactTestRenderer = null!

  const wrapUiIfNeeded = (innerElement: React.ReactElement) =>
    WrapperComponent ? React.createElement(WrapperComponent, null, innerElement) : innerElement

  await act(async () => {
    root = create(wrapUiIfNeeded(element))
  })

  function rerender(newElement = element) {
    root.update(wrapUiIfNeeded(newElement))
  }

  function unmount() {
    root.unmount()
  }

  return {
    toJson: () => toJson(root),
    rerender,
    unmount
  }
}

export async function renderHook<T>(
  hook: () => T,
  { wrapper }: { wrapper?: React.FunctionComponent<React.PropsWithChildren> | React.ComponentClass<React.PropsWithChildren> } = {}
) {
  const result = createRef<T | undefined>() as React.MutableRefObject<T | undefined>

  function TestComponent() {
    const pendingResult = hook()

    useEffect(() => {
      result.current = pendingResult
    })

    return null
  }

  const { rerender: baseRerender, unmount } = await render(<TestComponent />, { wrapper })

  function rerender() {
    return baseRerender(<TestComponent />)
  }

  return { result, rerender, unmount }
}
