// Inspired by react-three-fiber/examples
// https://github.com/pmndrs/react-three-fiber/blob/master/example/src/App.tsx
import React from 'react'
import { demoDots, demoName, demoPanel, dot, error, loadingContainer, loadingMessage, page } from './styles.css'
import { Link, Redirect, Route, useRoute } from 'wouter'

import * as demos from './demos'
import { useErrorBoundary } from 'use-error-boundary'

const DEFAULT_COMPONENT_NAME = 'Interactive'
const visibleComponents = Object.entries(demos).reduce(
  (acc, [name, item]) => ({ ...acc, [name]: item }),
  {} as Record<string, { Component: React.LazyExoticComponent<() => JSX.Element> }>
)

function ErrorBoundary({ children, fallback, name }: any) {
  const { ErrorBoundary, didCatch, error } = useErrorBoundary()
  return didCatch ? fallback(error) : <ErrorBoundary key={name}>{children}</ErrorBoundary>
}

function Demo() {
  const [match, params] = useRoute('/demo/:name')
  const compName = match && params.name && typeof params.name === 'string' ? params.name : DEFAULT_COMPONENT_NAME
  const Component = compName in visibleComponents ? visibleComponents[compName].Component : null

  if (!Component) {
    return null
  }

  return (
    <ErrorBoundary key={compName} fallback={(e: any) => <div className={error}>{e}</div>}>
      <Component />
    </ErrorBoundary>
  )
}

export const Loading = () => {
  return (
    <div className={loadingContainer}>
      <div className={loadingMessage}>Loading.</div>
    </div>
  )
}

function Dots() {
  const [match, params] = useRoute('/demo/:name')
  if (!match) return null

  return (
    <div className={demoPanel}>
      <div className={demoDots}>
        {Object.entries(visibleComponents).map(function mapper([name, _item]) {
          const background = params.name === name ? 'salmon' : '#fff'
          return <Link className={dot} key={name} to={`/demo/${name}`} style={{ background }} />
        })}
      </div>
      <div className={demoName}>{params.name}</div>
    </div>
  )
}

export function App() {
  const dev = new URLSearchParams(location.search).get('dev')
  return (
    <>
      <div className={page}>
        <React.Suspense fallback={<Loading />}>
          <Route path="/" children={<Redirect to={`/demo/${DEFAULT_COMPONENT_NAME}`} />} />
          <Route path="/demo/:name">
            <Demo />
          </Route>
        </React.Suspense>
        {dev === null && <Dots />}
      </div>
    </>
  )
}
