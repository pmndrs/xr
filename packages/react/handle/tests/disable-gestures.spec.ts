import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'
import { useDisableGestures } from '../src/disable-gestures.js'

describe('disable-gestures', () => {
  it('useDisableGestures should be a function', () => {
    expect(typeof useDisableGestures).toBe('function')
  })

  it('disable-gestures.css should exist', () => {
    const cssPath = resolve(__dirname, '../src/disable-gestures.css')
    expect(existsSync(cssPath)).toBe(true)
  })

  it('disable-gestures.css should contain touch-action and overscroll-behavior', () => {
    const cssPath = resolve(__dirname, '../src/disable-gestures.css')
    const css = readFileSync(cssPath, 'utf-8')
    expect(css).toContain('touch-action')
    expect(css).toContain('overscroll-behavior')
  })
})
