import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, create, ReactTestRenderer, ReactTestRendererJSON } from 'react-test-renderer'
import { XRButton } from './XR'
import * as React from 'react'
import { XRSystemMock } from './mocks/XRSystemMock'

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
const renderWithEffects = async (element: React.ReactElement) => {
  let root: ReactTestRenderer = null!

  await act(async () => {
    root = create(element)
  })

  return root
}

describe('XR', () => {
  let xrSystemMock = new XRSystemMock()
  beforeEach(() => {
    location.href = 'https://example.com'
    navigator.xr = xrSystemMock
  })

  afterEach(() => {
    delete navigator.xr
    vi.restoreAllMocks()
  })

  it('should render unsupported button if navigator.xr is not present', async () => {
    delete navigator.xr
    const root = await renderWithEffects(<XRButton mode="VR" />)
    const tree = toJson(root)
    expect(tree).toMatchInlineSnapshot(`
      <button>
        VR unsupported
      </button>
    `)
  })

  it('should render unsupported button if navigator.xr is present but isSessionSupported returns false for vr', async () => {
    xrSystemMock.isSessionSupported.mockResolvedValueOnce(false)
    const root = await renderWithEffects(<XRButton mode="VR" />)
    const tree = toJson(root)
    expect(tree).toMatchInlineSnapshot(`
      <button>
        VR unsupported
      </button>
    `)
  })

  it('should render https needed button if navigator.xr is present but protocol is not https', async () => {
    location.href = 'http://example.com'
    xrSystemMock.isSessionSupported.mockResolvedValueOnce(false)
    const root = await renderWithEffects(<XRButton mode="VR" />)
    const tree = toJson(root)
    expect(tree).toMatchInlineSnapshot(`
      <button>
        HTTPS needed
      </button>
    `)
  })

  it('should render unsupported button if navigator.xr is present but isSessionSupported rejects with non discernable error', async () => {
    xrSystemMock.isSessionSupported.mockRejectedValueOnce(new DOMException('', ''))
    const root = await renderWithEffects(<XRButton mode="VR" />)
    const tree = toJson(root)
    expect(tree).toMatchInlineSnapshot(`
      <button>
        VR unsupported
      </button>
    `)
  })

  it('should render https needed button if navigator.xr is present but isSessionSupported rejects with SecurityError', async () => {
    xrSystemMock.isSessionSupported.mockRejectedValueOnce(new DOMException('', 'SecurityError'))
    const root = await renderWithEffects(<XRButton mode="VR" />)
    const tree = toJson(root)
    expect(tree).toMatchInlineSnapshot(`
      <button>
        VR blocked
      </button>
    `)
  })

  it('should render enter vr button if navigator.xr is present and isSessionSupported returns true for vr', async () => {
    xrSystemMock.isSessionSupported.mockResolvedValueOnce(true)
    const root = await renderWithEffects(<XRButton mode="VR" />)
    const tree = toJson(root)
    expect(tree).toMatchInlineSnapshot(`
      <button
        onClick={[Function]}
      >
        Enter VR
      </button>
    `)
  })

  it('should render enter ar button if navigator.xr is present and isSessionSupported returns true for ar', async () => {
    xrSystemMock.isSessionSupported.mockResolvedValueOnce(true)
    const root = await renderWithEffects(<XRButton mode="AR" />)
    const tree = toJson(root)
    expect(tree).toMatchInlineSnapshot(`
      <button
        onClick={[Function]}
      >
        Enter AR
      </button>
    `)
  })
})
