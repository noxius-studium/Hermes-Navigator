import {
  Button,
  Codicon,
  FadeScroll,
  host,
  NativeNavigatorSessions,
  pluginSettingsHref,
  ProfileRail,
  useValue
} from '@hermes/plugin-sdk'
import { useMemo, useState } from 'react'

import { projectDestinations } from './domain'
import { DestinationList } from './layout-shared'
import { navigatorDestinations, navigatorPreferences } from './state'

export function PeekDrawerLayout() {
  const preferences = useValue(navigatorPreferences)
  const source = useValue(navigatorDestinations)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const catalog = useMemo(() => projectDestinations(source, preferences), [preferences, source])
  const configured = catalog.visible.filter(item => item.favorite)

  const favourites = configured.length
    ? configured
    : catalog.visible.slice(0, 6)

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <header className="shrink-0 px-3 pb-2 pt-2">
        <div className="flex h-9 items-center">
          <span className="flex-1 text-xs font-semibold uppercase tracking-wide text-(--ui-text-secondary)">Workspace</span>
          <Button aria-label="New session" onClick={() => host.newChat()} size="icon" variant="ghost"><Codicon name="add" /></Button>
          <Button aria-label="Navigator Studio" onClick={() => host.navigate(pluginSettingsHref('navigator', 'studio'))} size="icon" variant="ghost"><Codicon name="settings-gear" /></Button>
        </div>
        <button className="flex w-full items-center gap-2 rounded-md bg-(--ui-bg-quaternary) px-3 py-2 text-left text-xs text-(--ui-text-secondary) hover:bg-(--chrome-action-hover)" onClick={() => setDrawerOpen(value => !value)} type="button">
          <Codicon className="text-(--ui-accent)" name="symbol-keyword" />
          <span>Open destination</span>
        </button>
        <div className="mt-2 flex items-center gap-1 overflow-hidden">
          {favourites.slice(0, 6).map(item => item && <Button aria-label={`Open ${item.label}`} key={item.id} onClick={() => host.navigate(item.path)} size="icon" variant="ghost"><Codicon name={item.codicon ?? 'circle-outline'} /></Button>)}
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden">
        {drawerOpen ? <FadeScroll className="scrollbar-fade h-full" maxHeight="none"><DestinationList destinations={catalog.all} /></FadeScroll> : <NativeNavigatorSessions />}
      </div>
      {drawerOpen && <ProfileRail />}
    </div>
  )
}
