import { proxy } from 'valtio'

const ping = new Audio('ping.mp3')

export const state = proxy({
  count: 0,
  api: {
    pong(velocity) {
      console.log(velocity)
      ping.currentTime = 0
      ping.volume = Math.min(Math.max(0, velocity / 20, 0), 1)
      ping.play()
      if (velocity > 10) ++state.count
    },
    reset: () => (state.count = 0),
  },
})
