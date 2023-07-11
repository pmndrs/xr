import { lazy } from 'react'

const Interactive = { Component: lazy(() => import('./Interactive')) }
const HitTest = { Component: lazy(() => import('./HitTest')) }
const Player = { Component: lazy(() => import('./Player')) }
const Text = { Component: lazy(() => import('./Text')) }
const Hands = { Component: lazy(() => import('./Hands')) }
const ControllersEnvMap = { Component: lazy(() => import('./ControllersEnvMap')) }
const Teleport = { Component: lazy(() => import('./Teleport')) }
const CameraLinkedObject = { Component: lazy(() => import('./CameraLinkedObject')) }

export { Interactive, HitTest, Player, Text, Hands, Teleport, CameraLinkedObject, ControllersEnvMap }
