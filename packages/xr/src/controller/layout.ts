import { DefaultAssetBasePath } from '../index.js'

export type XRControllerVisualResponse = {
  states: Array<'default' | 'touched' | 'pressed'>
  valueNodeName: string
} & (
  | {
      componentProperty: 'xAxis' | 'yAxis' | 'button' | 'state'
      valueNodeProperty: 'transform'
      minNodeName: string
      maxNodeName: string
    }
  | {
      componentProperty: 'state'
      valueNodeProperty: 'visibility'
    }
)

export type XRControllerComponent = {
  type: 'trigger' | 'squeeze' | 'touchpad' | 'thumbstick' | 'button' | string
  gamepadIndices: {
    [Key in 'button' | 'xAxis' | 'yAxis']?: number
  }
  rootNodeName: string
  touchPointNodeName: string
  visualResponses: Record<string, XRControllerVisualResponse>
}

export type XRControllerLayout = {
  selectComponentId: string
  components: {
    [Key in string]: XRControllerComponent
  }
  gamepadMapping: string
  rootNodeName: string
  assetPath: string
}

type XRControllerProfile = {
  profileId: string
  fallbackProfileIds: Array<string>
  deprecatedProfileIds?: Array<string>
  layouts: {
    [Key in 'left' | 'right' | 'none' | 'left-right' | 'left-right-none' | string]?: XRControllerLayout
  }
}

type XRControllerProfilesList = Record<string, { path: string }>

const DefaultDefaultControllerProfileId = 'generic-trigger'

export type XRControllerLayoutLoaderOptions = {
  baseAssetPath?: string
  defaultControllerProfileId?: string
}

export class XRControllerLayoutLoader {
  private readonly baseAssetPath: string
  private readonly defaultProfileId: string

  //cache
  private profilesListPromise: Promise<XRControllerProfilesList> | undefined
  private profilePromisesMap = new Map<string, Promise<XRControllerProfile>>()

  constructor(options?: XRControllerLayoutLoaderOptions) {
    this.baseAssetPath = options?.baseAssetPath ?? DefaultAssetBasePath
    this.defaultProfileId = options?.defaultControllerProfileId ?? DefaultDefaultControllerProfileId
  }

  async load(inputSourceProfileIds: ReadonlyArray<string>, handedness: XRHandedness) {
    const profile = await this.loadProfile(inputSourceProfileIds)
    for (const key in profile.layouts) {
      if (!key.includes(handedness)) {
        continue
      }
      return profile.layouts[key]!
    }
    throw new Error(
      `No matching layout for "${handedness}", in profile ${profile.profileId} with layouts ${Object.keys(
        profile.layouts,
      ).join(', ')}.`,
    )
  }

  //alias for Loader compatibility
  loadAsync = this.load

  private async loadProfile(inputSourceProfileIds: ReadonlyArray<string>) {
    this.profilesListPromise ??= fetchJson<XRControllerProfilesList>(
      new URL('profilesList.json', this.baseAssetPath).href,
    )
    const profilesList = await this.profilesListPromise
    const length = inputSourceProfileIds.length
    for (let i = 0; i < length; i++) {
      const profileInfo = profilesList[inputSourceProfileIds[i]]
      if (profileInfo == null) {
        continue
      }
      return this.loadProfileFromPathCached(profileInfo.path)
    }
    const profileInfo = profilesList[this.defaultProfileId]
    if (profileInfo != null) {
      return this.loadProfileFromPathCached(profileInfo.path)
    }
    throw new Error(
      `no matching profile found for profiles "${inputSourceProfileIds.join(', ')}" in profile list ${JSON.stringify(
        profilesList,
      )}`,
    )
  }

  private loadProfileFromPathCached(relativeProfilePath: string) {
    let promise = this.profilePromisesMap.get(relativeProfilePath)
    if (promise == null) {
      this.profilePromisesMap.set(relativeProfilePath, (promise = this.loadProfileFromPath(relativeProfilePath)))
    }
    return promise
  }

  private async loadProfileFromPath(relativeProfilePath: string) {
    const absoluteProfilePath = new URL(relativeProfilePath, this.baseAssetPath).href
    const profile = await fetchJson<XRControllerProfile>(absoluteProfilePath)

    //overwrite the relative assetPath into an absolute path
    for (const key in profile.layouts) {
      const layout = profile.layouts[key]
      if (layout == null) {
        continue
      }
      layout.assetPath = new URL(layout.assetPath, absoluteProfilePath).href
    }

    return profile
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  let response = await fetch(url)
  if (!response.ok) {
    return Promise.reject(new Error(response.statusText))
  }
  return response.json()
}
