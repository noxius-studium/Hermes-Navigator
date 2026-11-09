import { afterEach, describe, expect, it } from 'vitest'

import { SIDEBAR_NAV_AREA } from '@/app/routes'
import { createPluginContext } from '@/contrib/plugin'
import { registry } from '@/contrib/registry'
import { registerAppLocale, setRuntimeI18nLocale } from '@/i18n'
import { host } from '@/sdk'
import { SIDEBAR_NAV_PREFS_AREA } from '@/store/sidebar-nav'

import type { SidebarDestination } from './sidebar-destinations'

const disposers: Array<() => void> = []

afterEach(() => {
  disposers.splice(0).forEach(dispose => dispose())
  setRuntimeI18nLocale('en')
})

describe('host.sidebarNav', () => {
  it('lists the raw route-backed core catalog without the action-only new session row', () => {
    expect(host.sidebarNav.list()).toEqual([
      { id: 'capabilities', source: 'core', path: '/capabilities', label: 'Capabilities', codicon: 'symbol-misc' },
      { id: 'messaging', source: 'core', path: '/messaging', label: 'Messaging', codicon: 'comment' },
      { id: 'artifacts', source: 'core', path: '/artifacts', label: 'Artifacts', codicon: 'files', tier: 'advanced' },
      { id: 'cron', source: 'core', path: '/cron', label: 'Scheduled jobs', codicon: 'watch', tier: 'advanced' }
    ])
  })

  it('returns immutable destination snapshots without leaking comparison state', () => {
    const destinations = host.sidebarNav.list()

    expect(Object.isFrozen(destinations)).toBe(true)
    expect(Object.isFrozen(destinations[0])).toBe(true)
    expect(() => {
      ;(destinations as SidebarDestination[])[0]!.label = 'Mutated'
    }).toThrow(TypeError)
    expect(host.sidebarNav.list()[0]?.label).toBe('Capabilities')
  })

  it('reconciles a sidebar mutation made from the initial snapshot callback', () => {
    const snapshots: unknown[] = []
    let disposePlugin: (() => void) | undefined

    const unsubscribe = host.sidebarNav.subscribe(snapshot => {
      snapshots.push(snapshot)

      if (snapshots.length === 1) {
        disposePlugin = registry.register({
          area: SIDEBAR_NAV_AREA,
          id: 'during-initial-callback',
          data: { label: 'During initial callback', path: '/during-initial-callback' }
        })
      }
    })

    disposers.push(unsubscribe, () => disposePlugin?.())

    expect(snapshots).toHaveLength(2)
    expect(snapshots[1]).toContainEqual({
      id: 'during-initial-callback',
      source: 'core',
      path: '/during-initial-callback',
      label: 'During initial callback',
      codicon: 'plug'
    })
  })

  it('uses final namespaced plugin ids and only emits snapshots for sidebar destination changes', () => {
    const snapshots: unknown[] = []
    const unsubscribe = host.sidebarNav.subscribe(snapshot => snapshots.push(snapshot))
    const plugin = createPluginContext('kanban')

    const disposePlugin = plugin.register({
      area: SIDEBAR_NAV_AREA,
      id: 'nav',
      data: { codicon: 'project', label: 'Kanban', path: '/kanban', tier: 'advanced' }
    })

    disposers.push(unsubscribe, disposePlugin)
    disposers.push(registry.register({ area: 'unrelated', id: 'ignored', data: { label: 'Ignored' } }))
    disposers.push(registry.register({ area: SIDEBAR_NAV_PREFS_AREA, id: 'prefs', data: { hide: ['kanban:nav'] } }))

    expect(snapshots).toHaveLength(2)
    expect(host.sidebarNav.list().at(-1)).toEqual({
      id: 'kanban:nav',
      source: 'plugin:kanban',
      path: '/kanban',
      label: 'Kanban',
      codicon: 'project',
      tier: 'advanced'
    })

    disposePlugin()
    expect(snapshots).toHaveLength(3)
    expect(host.sidebarNav.list()).toHaveLength(4)
  })

  it('does not notify after unsubscribe for registry or locale catalog changes', () => {
    const snapshots: unknown[] = []
    const unsubscribe = host.sidebarNav.subscribe(snapshot => snapshots.push(snapshot))

    unsubscribe()

    const disposePlugin = registry.register({
      area: SIDEBAR_NAV_AREA,
      id: 'after-unsubscribe',
      data: { label: 'After unsubscribe', path: '/after-unsubscribe' }
    })

    const disposeLocale = registerAppLocale('en', { translations: { 'sidebar.nav.capabilities': 'After unsubscribe' } }, 'plugin:after-unsubscribe')

    disposers.push(disposePlugin, disposeLocale)

    expect(snapshots).toHaveLength(1)
  })

  it('updates core labels when an active-locale catalog source registers or disposes', () => {
    const snapshots: Array<readonly { id: string; label: string }[]> = []
    const unsubscribe = host.sidebarNav.subscribe(snapshot => snapshots.push(snapshot))
    const disposeLocale = registerAppLocale('en', { translations: { 'sidebar.nav.capabilities': 'Plugin capabilities' } }, 'plugin:locale')

    disposers.push(unsubscribe, disposeLocale)

    expect(snapshots).toHaveLength(2)
    expect(snapshots[1]?.find(destination => destination.id === 'capabilities')?.label).toBe('Plugin capabilities')

    disposeLocale()

    expect(snapshots).toHaveLength(3)
    expect(snapshots[2]?.find(destination => destination.id === 'capabilities')?.label).toBe('Capabilities')
  })

  it('filters malformed sidebar contributions and updates core labels when the locale changes', () => {
    const snapshots: unknown[] = []
    const unsubscribe = host.sidebarNav.subscribe(snapshot => snapshots.push(snapshot))

    disposers.push(unsubscribe)
    disposers.push(
      registry.registerMany([
        { area: SIDEBAR_NAV_AREA, id: 'relative', data: { codicon: 'project', label: 'Relative', path: 'kanban' } },
        { area: SIDEBAR_NAV_AREA, id: 'blank', data: { codicon: 'project', label: ' ', path: '/blank' } }
      ])
    )

    expect(host.sidebarNav.list()).toHaveLength(4)
    expect(snapshots).toHaveLength(1)

    setRuntimeI18nLocale('de')

    expect(host.sidebarNav.list()[0]?.label).toBe('Fähigkeiten')
    expect(snapshots).toHaveLength(2)
  })
})
