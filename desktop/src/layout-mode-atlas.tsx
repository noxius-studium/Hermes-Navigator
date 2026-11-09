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
import { useEffect, useMemo, useState } from 'react'

import { type NavigatorCategory, projectDestinations } from './domain'
import { DestinationList } from './layout-shared'
import { navigatorDestinations, navigatorPreferences } from './state'

export function ModeAtlasLayout() {
  const preferences = useValue(navigatorPreferences)
  const source = useValue(navigatorDestinations)
  const [lane, setLane] = useState<'sessions' | NavigatorCategory>('sessions')
  const catalog = useMemo(() => projectDestinations(source, preferences), [preferences, source])

  const lanes = useMemo(
    () => [
      { id: 'sessions', icon: 'comment-discussion', label: 'Sessions' },
      ...preferences.categories.filter(category => !category.hidden)
    ],
    [preferences.categories]
  )

  const current = lanes.find(item => item.id === lane) ?? lanes[0]
  const destinations = lane === 'sessions' ? [] : catalog.all.filter(item => item.category === lane)

  useEffect(() => {
    if (!lanes.some(item => item.id === lane)) {setLane('sessions')}
  }, [lane, lanes])

  return <div className="flex h-full min-h-0 overflow-hidden">
    <aside className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-(--ui-stroke-tertiary) bg-(--ui-sidebar-surface-background) px-1 py-2">{lanes.map(item => <button aria-label={item.label} className={`flex w-full flex-col items-center gap-0.5 rounded-md px-1 py-2 text-[0.5625rem] ${lane === item.id ? 'bg-(--ui-control-active-background) text-(--ui-accent)' : 'text-(--ui-text-tertiary) hover:bg-(--chrome-action-hover)'}`} key={item.id} onClick={() => setLane(item.id)} type="button"><Codicon name={item.icon} /><span className="max-w-full truncate">{item.label}</span></button>)}<div className="min-h-0 flex-1" /><Button aria-label="Navigator Studio" onClick={() => host.navigate(pluginSettingsHref('navigator', 'studio'))} size="icon" variant="ghost"><Codicon name="settings-gear" /></Button></aside>
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden"><header className="flex h-11 shrink-0 items-center px-3"><span className="flex-1 text-xs font-semibold uppercase tracking-wide text-(--ui-text-secondary)">{current.label}</span><Button aria-label="New session" onClick={() => host.newChat()} size="icon" variant="ghost"><Codicon name="add" /></Button><Button aria-label="Navigator Studio" onClick={() => host.navigate(pluginSettingsHref('navigator', 'studio'))} size="icon" variant="ghost"><Codicon name="settings-gear" /></Button></header><div className="min-h-0 flex-1 overflow-hidden">{lane === 'sessions' ? <NativeNavigatorSessions /> : <FadeScroll className="scrollbar-fade h-full" maxHeight="none"><DestinationList destinations={destinations} /></FadeScroll>}</div>{lane !== 'sessions' && <ProfileRail />}</div>
  </div>
}
