import { useValue } from '@hermes/plugin-sdk'

import { ModeAtlasLayout } from './layout-mode-atlas'
import { PeekDrawerLayout } from './layout-peek-drawer'
import { navigatorPreferences } from './state'

export function NavigatorPane() {
  const preferences = useValue(navigatorPreferences)


  if (preferences.layoutPreset === 'atlas') {
    return <ModeAtlasLayout />
  }

  return <PeekDrawerLayout />
}
