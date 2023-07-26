import { create } from '@react-three/test-renderer'
import * as React from 'react'

export async function render(
  element: React.ReactElement,
  {
    wrapper: WrapperComponent
  }: { wrapper?: React.FunctionComponent<React.PropsWithChildren> | React.ComponentClass<React.PropsWithChildren> } = {}
) {
  const wrapUiIfNeeded = (innerElement: React.ReactElement) =>
    WrapperComponent ? React.createElement(WrapperComponent, null, innerElement) : innerElement

  const renderer = await create(wrapUiIfNeeded(element))

  async function rerender(newElement = element) {
    await renderer.update(wrapUiIfNeeded(newElement))
  }

  async function unmount() {
    await renderer.unmount()
  }

  return {
    renderer,
    rerender,
    unmount
  }
}
