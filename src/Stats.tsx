/**
 * @see https://github.com/mrdoob/stats.js
 */

import { addAfterEffect, addEffect, createPortal, useThree } from '@react-three/fiber'
import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { CanvasTexture } from 'three'

interface Panel {
  update(value: number, maxValue: number): void
}

interface Stats {
  begin(): void
  end(): number
  update(): void
  canvas: HTMLCanvasElement
  size: { width: number; height: number }
}

declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number
      jsHeapSizeLimit: number
    }
  }
}

type PanelType = 'FPS' | 'MS' | 'MB'

const createStats = function (enabledPanels: PanelType[]): Stats | undefined {
  if (enabledPanels.length <= 0) {
    return
  }

  if (enabledPanels.includes('MB') && !self.performance.memory) {
    enabledPanels = enabledPanels.filter((x) => x !== 'MB')
  }

  var beginTime = (performance || Date).now(),
    prevTime = beginTime,
    frames = 0

  var PR = Math.round(4)

  const WIDTH = 80 * PR,
    HEIGHT = 48 * PR

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    console.error(`no context 2d for stats panel`)
    return
  }

  canvas.width = WIDTH * enabledPanels.length
  canvas.height = HEIGHT
  canvas.style.cssText = `width:${80 * enabledPanels.length}px;height:48px`

  let panelsIndex = 0
  const getPosition = () => {
    return {
      x: WIDTH * panelsIndex,
      y: 0,
      width: WIDTH,
      height: HEIGHT,
      PR
    }
  }

  let fpsPanel: Panel | undefined
  if (enabledPanels.includes('FPS')) {
    fpsPanel = Panel('FPS', canvas, context, getPosition(), '#0ff', '#002')
    panelsIndex++
  }
  let msPanel: Panel | undefined
  if (enabledPanels.includes('MS')) {
    msPanel = Panel('MS', canvas, context, getPosition(), '#0f0', '#020')
    panelsIndex++
  }

  let memPanel: Panel | undefined
  if (enabledPanels.includes('MB')) {
    memPanel = Panel('MB', canvas, context, getPosition(), '#f08', '#201')
    panelsIndex++
  }

  return {
    canvas,

    size: { width: WIDTH * enabledPanels.length, height: HEIGHT },

    begin: function () {
      beginTime = performance.now()
    },

    end: function () {
      frames++

      var time = performance.now()

      msPanel?.update(time - beginTime, 200)

      if (time >= prevTime + 1000) {
        fpsPanel?.update((frames * 1000) / (time - prevTime), 100)

        prevTime = time
        frames = 0

        if (memPanel && performance.memory) {
          memPanel.update(performance.memory.usedJSHeapSize / 1048576, performance.memory.jsHeapSizeLimit / 1048576)
        }
      }

      return time
    },

    update: function () {
      beginTime = this.end()
    }
  }
}

const Panel = function (
  name: string,
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  position: { x: number; y: number; width: number; height: number; PR: number },
  fg: string | CanvasGradient | CanvasPattern,
  bg: string | CanvasGradient | CanvasPattern
) {
  var min = Infinity,
    max = 0,
    round = Math.round
  const { x: X, y: Y, width: WIDTH, height: HEIGHT, PR } = position

  var TEXT_X = 3 * PR,
    TEXT_Y = 2 * PR,
    GRAPH_X = 3 * PR,
    GRAPH_Y = 15 * PR,
    GRAPH_WIDTH = 74 * PR,
    GRAPH_HEIGHT = 30 * PR

  context.font = 'bold ' + 9 * PR + 'px Helvetica,Arial,sans-serif'
  context.textBaseline = 'top'

  context.fillStyle = bg
  context.fillRect(X, Y, WIDTH, HEIGHT)

  context.fillStyle = fg
  context.fillText(name, X + TEXT_X, Y + TEXT_Y)
  context.fillRect(X + GRAPH_X, Y + GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT)

  context.fillStyle = bg
  context.globalAlpha = 0.9
  context.fillRect(X + GRAPH_X, Y + GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT)

  return {
    update: function (value: number, maxValue: number) {
      min = Math.min(min, value)
      max = Math.max(max, value)

      context.fillStyle = bg
      context.globalAlpha = 1
      context.fillRect(X, Y, WIDTH, GRAPH_Y)
      context.fillStyle = fg
      context.fillText(round(value) + ' ' + name + ' (' + round(min) + '-' + round(max) + ')', X + TEXT_X, Y + TEXT_Y)

      context.drawImage(
        canvas,
        X + GRAPH_X + PR,
        Y + GRAPH_Y,
        GRAPH_WIDTH - PR,
        GRAPH_HEIGHT,
        X + GRAPH_X,
        Y + GRAPH_Y,
        GRAPH_WIDTH - PR,
        GRAPH_HEIGHT
      )

      context.fillRect(X + GRAPH_X + GRAPH_WIDTH - PR, Y + GRAPH_Y, PR, GRAPH_HEIGHT)

      context.fillStyle = bg
      context.globalAlpha = 0.9
      context.fillRect(X + GRAPH_X + GRAPH_WIDTH - PR, Y + GRAPH_Y, PR, round((1 - value / maxValue) * GRAPH_HEIGHT))
    }
  }
}

interface StatsProps {
  enabledPanels: PanelType[]
}

export const Stats = ({ enabledPanels }: StatsProps) => {
  const [stats, setStats] = useState<Stats | undefined>()
  const camera = useThree((s) => s.camera)
  const canvasTexture = useRef<CanvasTexture>(null)

  useEffect(() => {
    const stats = createStats(enabledPanels)

    if (!stats) {
      return
    }

    setStats(stats)

    const begin = addEffect(() => {
      stats.begin()
      if (canvasTexture.current) {
        canvasTexture.current.needsUpdate = true
      }
    })
    const end = addAfterEffect(() => stats.end())
    return () => {
      begin()
      end()
    }
  }, [JSON.stringify(enabledPanels)])

  if (!stats) {
    return null
  }

  return (
    <>
      {createPortal(
        <mesh position={[0, 0.3, -1]} scale={0.001}>
          <planeGeometry args={[stats.size.width, stats.size.height]} />
          <meshStandardMaterial>
            <canvasTexture attach="map" args={[stats.canvas]} ref={canvasTexture} />
          </meshStandardMaterial>
        </mesh>,
        camera
      )}
    </>
  )
}
