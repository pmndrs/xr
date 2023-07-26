import { Profile } from 'three-stdlib'

export class ProfileMock implements Profile {
  constructor({
    profileId = 'oculus-touch-v3',
    fallbackProfileIds = [],
    layouts = {}
  }: { profileId?: string; fallbackProfileIds?: string[]; layouts?: Profile['layouts'] } = {}) {
    this.profileId = profileId
    this.fallbackProfileIds = fallbackProfileIds
    this.layouts = layouts
  }
  profileId: string
  fallbackProfileIds: string[]
  layouts: Profile['layouts']
}
