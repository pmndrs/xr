import { beforeEach, afterEach } from 'vitest'
import { create } from '@react-three/test-renderer'
import * as React from 'react'

// https://github.com/testing-library/react-testing-library/blob/main/src/act-compat.js
function getGlobalThis() {
  /* istanbul ignore else */
  if (typeof globalThis !== 'undefined') {
    return globalThis
  }
  /* istanbul ignore next */
  if (typeof self !== 'undefined') {
    return self
  }
  /* istanbul ignore next */
  if (typeof window !== 'undefined') {
    return window
  }
  /* istanbul ignore next */
  if (typeof global !== 'undefined') {
    return global
  }
  /* istanbul ignore next */
  throw new Error('unable to locate global object')
}

function setIsReactActEnvironment(isReactActEnvironment: boolean | undefined) {
  ;(getGlobalThis() as any).IS_REACT_ACT_ENVIRONMENT = isReactActEnvironment
}

function getIsReactActEnvironment() {
  return (getGlobalThis() as any).IS_REACT_ACT_ENVIRONMENT
}

let existingIsReactActEnvironment: boolean | undefined

beforeEach(() => {
  existingIsReactActEnvironment = getIsReactActEnvironment()
  setIsReactActEnvironment(true)
})

afterEach(() => {
  setIsReactActEnvironment(existingIsReactActEnvironment)
  existingIsReactActEnvironment = undefined
})

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
