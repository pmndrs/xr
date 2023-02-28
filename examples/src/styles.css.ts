import { style, globalStyle } from '@vanilla-extract/css'

export const page = style({
  position: 'relative',
  width: '100%',
  height: '100%',
  maxWidth: '100vw',
  maxHeight: '100vh'
})

globalStyle(`${page} > h1`, {
  fontFamily: "'Roboto', sans-serif",
  fontWeight: 900,
  fontSize: '8em',
  margin: 0,
  color: 'white',
  lineHeight: '0.59em',
  letterSpacing: '-2px',
  position: 'absolute',
  top: '70px',
  left: '60px'
})

export const demoPanel = style({
  zIndex: 1000,
  position: 'absolute',
  bottom: '80px',
  left: '50px',
  right: '60px',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between'
})

export const demoDots = style({
  maxWidth: '250px'
})

export const demoName = style({
  color: 'white',
  display: 'inline-flex',
  alignItems: 'center',
  marginBottom: '13px'
})

globalStyle(`${page} > a`, {
  margin: 0,
  color: 'white',
  textDecoration: 'none'
})

globalStyle(`${page} > h1`, {
  '@media': {
    'only screen and (max-width: 1000px)': {
      fontSize: '5em',
      letterSpacing: '-1px'
    }
  }
})

globalStyle('html, body, #root', {
  width: '100%',
  height: '100%',
  margin: 0,
  padding: 0,
  WebkitTouchCallout: 'none',
  WebkitUserSelect: 'none',
  KhtmlUserSelect: 'none',
  MozUserSelect: 'none',
  msUserSelect: 'none',
  userSelect: 'none',
  overflow: 'hidden'
})

globalStyle('*', {
  boxSizing: 'border-box'
})

globalStyle('#root', {
  overflow: 'auto'
})

globalStyle('body', {
  position: 'fixed',
  overflow: 'hidden',
  overscrollBehaviorY: 'none',
  fontFamily: "'Inter var', sans-serif",
  color: 'black',
  background: '#dedddf !important'
})

globalStyle('canvas', {
  touchAction: 'none'
})

export const dot = style({ display: 'inline-block', width: '20px', height: '20px', borderRadius: '50%', margin: '8px' })

export const loadingContainer = style({
  position: 'fixed',
  inset: 0,
  zIndex: 100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#dedddf',
  color: 'white'
})

export const loadingMessage = style({
  fontFamily: "'Inter', Helvetica, sans-serif"
})

export const error = style({
  position: 'absolute',
  padding: '10px 20px',
  bottom: 'unset',
  right: 'unset',
  top: '60px',
  left: '60px',
  maxWidth: '380px',
  border: '2px solid #ff5050',
  color: '#ff5050'
})
