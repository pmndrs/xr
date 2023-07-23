import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { XRButton } from './XR'
import * as React from 'react'
import { XRSystemMock } from './mocks/XRSystemMock'
import { render } from './testUtils/testUtilsDom'

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
    const { toJson } = await render(<XRButton mode="VR" />)
    const tree = toJson()
    expect(tree).toMatchInlineSnapshot(`
      <button>
        VR unsupported
      </button>
    `)
  })

  it('should render unsupported button if navigator.xr is present but isSessionSupported returns false for vr', async () => {
    xrSystemMock.isSessionSupported.mockResolvedValueOnce(false)
    const { toJson } = await render(<XRButton mode="VR" />)
    const tree = toJson()
    expect(tree).toMatchInlineSnapshot(`
      <button>
        VR unsupported
      </button>
    `)
  })

  it('should render https needed button if navigator.xr is present but protocol is not https', async () => {
    location.href = 'http://example.com'
    xrSystemMock.isSessionSupported.mockResolvedValueOnce(false)
    const { toJson } = await render(<XRButton mode="VR" />)
    const tree = toJson()
    expect(tree).toMatchInlineSnapshot(`
      <button>
        HTTPS needed
      </button>
    `)
  })

  it('should render unsupported button if navigator.xr is present but isSessionSupported rejects with non discernable error', async () => {
    xrSystemMock.isSessionSupported.mockRejectedValueOnce(new DOMException('', ''))
    const { toJson } = await render(<XRButton mode="VR" />)
    const tree = toJson()
    expect(tree).toMatchInlineSnapshot(`
      <button>
        VR unsupported
      </button>
    `)
  })

  it('should render https needed button if navigator.xr is present but isSessionSupported rejects with SecurityError', async () => {
    xrSystemMock.isSessionSupported.mockRejectedValueOnce(new DOMException('', 'SecurityError'))
    const { toJson } = await render(<XRButton mode="VR" />)
    const tree = toJson()
    expect(tree).toMatchInlineSnapshot(`
      <button>
        VR blocked
      </button>
    `)
  })

  it('should render enter vr button if navigator.xr is present and isSessionSupported returns true for vr', async () => {
    xrSystemMock.isSessionSupported.mockResolvedValueOnce(true)
    const { toJson } = await render(<XRButton mode="VR" />)
    const tree = toJson()
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
    const { toJson } = await render(<XRButton mode="AR" />)
    const tree = toJson()
    expect(tree).toMatchInlineSnapshot(`
      <button
        onClick={[Function]}
      >
        Enter AR
      </button>
    `)
  })
})
