import { DefaultAssetBasePath } from '../index.js'
import { syncAsync } from './utils.js'

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
  /**
   * where to load the controller profiles and models from
   * @default 'https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles/'
   */
  baseAssetPath?: string
  /**
   * profile id that is used if no matching profile id is found
   * @default 'generic-trigger'
   */
  defaultControllerProfileId?: string
}

export class XRControllerLayoutLoader {
  private readonly baseAssetPath: string
  private readonly defaultProfileId: string

  //cache
  private profilesListCache: XRControllerProfilesList | undefined
  private profileCacheMap = new Map<string, XRControllerProfile>()

  constructor(options?: XRControllerLayoutLoaderOptions) {
    this.baseAssetPath = options?.baseAssetPath ?? DefaultAssetBasePath
    this.defaultProfileId = options?.defaultControllerProfileId ?? DefaultDefaultControllerProfileId
  }

  load(
    inputSourceProfileIds: ReadonlyArray<string>,
    handedness: XRHandedness,
  ): Promise<XRControllerLayout> | XRControllerLayout {
    return syncAsync(
      //load profile
      () => this.loadProfile(inputSourceProfileIds),
      //get controller layout from profile
      (profile) => {
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
      },
    )
  }

  //alias for Loader compatibility
  loadAsync = this.load

  private loadProfile(inputSourceProfileIds: ReadonlyArray<string>) {
    return syncAsync(
      //load profiles list
      () =>
        this.profilesListCache ??
        fetchJson<XRControllerProfilesList>(new URL('profilesList.json', this.baseAssetPath).href).then(
          (profilesList) => (this.profilesListCache = profilesList),
        ),
      //load profile
      (profilesList) => {
        const length = inputSourceProfileIds.length
        let profileInfo: undefined | { path: string }
        for (let i = 0; i < length; i++) {
          profileInfo = profilesList[inputSourceProfileIds[i]]
          if (profileInfo != null) {
            break
          }
        }
        profileInfo ??= profilesList[this.defaultProfileId]
        if (profileInfo == null) {
          throw new Error(
            `no matching profile found for profiles "${inputSourceProfileIds.join(', ')}" in profile list ${JSON.stringify(
              profilesList,
            )}`,
          )
        }
        return this.loadProfileFromPath(profileInfo.path)
      },
    )
  }

  private loadProfileFromPath(relativeProfilePath: string) {
    const result = this.profileCacheMap.get(relativeProfilePath)
    if (result != null) {
      return result
    }
    const absoluteProfilePath = new URL(relativeProfilePath, this.baseAssetPath).href
    return fetchJson<XRControllerProfile>(absoluteProfilePath).then((profile) => {
      //overwrite the relative assetPath into an absolute path
      for (const key in profile.layouts) {
        const layout = profile.layouts[key]
        if (layout == null) {
          continue
        }
        layout.assetPath = new URL(layout.assetPath, absoluteProfilePath).href
      }

      this.profileCacheMap.set(relativeProfilePath, profile)

      return profile
    })
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  let response = await fetch(url)
  if (!response.ok) {
    return Promise.reject(new Error(response.statusText))
  }
  return response.json()
}
