import {
  type HermesPlugin,
  host,
  PALETTE_AREA,
  type PaletteContribution,
  pluginSettingsHref,
  type SidebarDestination
} from '@hermes/plugin-sdk'

import { NavigatorPane } from './navigator-pane'
import { NavigatorStudio } from './navigator-studio'
import { hydrateNavigatorPreferences, invalidateNavigatorData, navigatorDestinations } from './state'

const destinationCommandId = (id: string) => `destination:${id}`

// These are the established first-class pages in this Desktop setup. Runtime
// plugins still auto-register through host.sidebarNav; the fallback rows keep
// Navigator complete while an opt-in desktop half is still loading or its
// enable decision belongs to another Electron user-data profile.
const REQUIRED_DESTINATIONS: readonly SidebarDestination[] = Object.freeze([
  Object.freeze({ id: 'fluid-music:media-nav', source: 'plugin:fluid-music', path: '/media', label: 'Media', codicon: 'music' }),
  Object.freeze({ id: 'hermes-security:nav', source: 'plugin:hermes-security', path: '/security', label: 'Security', codicon: 'shield' }),
  Object.freeze({ id: 'hyatlas:nav', source: 'plugin:hyatlas', path: '/hyatlas', label: 'HyAtlas Memory', codicon: 'database' }),
  Object.freeze({ id: 'composer-enhancements:sidebar-nav', source: 'plugin:composer-enhancements', path: '/enchanted-composer', label: 'Enchanted Composer', codicon: 'sparkle' }),
  Object.freeze({ id: 'kanban:nav', source: 'plugin:kanban', path: '/kanban', label: 'Kanban', codicon: 'project' })
])

function completeDestinations(destinations: readonly SidebarDestination[]): readonly SidebarDestination[] {
  const paths = new Set(destinations.map(destination => destination.path))

  return Object.freeze([...destinations, ...REQUIRED_DESTINATIONS.filter(destination => !paths.has(destination.path))])
}

const plugin: HermesPlugin = {
  id: 'navigator',
  name: 'Navigator',
  description: 'A customizable destination and session navigator, stacked beside native Sessions.',
  defaultEnabled: true,
  register(ctx) {
    // Plugin-local strings are intentionally scoped through ctx.i18n; the core locale catalog remains untouched.
    ctx.i18n.register({ en: { open: 'Open Navigator', studio: 'Open Navigator Studio' } })
    hydrateNavigatorPreferences(ctx.storage)

    const applyDestinations = (destinations: readonly SidebarDestination[]) =>
      navigatorDestinations.set(completeDestinations(destinations))

    applyDestinations(host.sidebarNav.list())
    ctx.onDispose(host.sidebarNav.subscribe(applyDestinations))
    ctx.onEvent('sessions.changed', () => invalidateNavigatorData('sessions.changed'))
    ctx.onEvent('projects.changed', () => invalidateNavigatorData('projects.changed'))

    ctx.register({
      id: 'pane',
      area: 'panes',
      title: 'Navigator',
      data: { placement: 'left', dock: { pane: 'sessions', pos: 'center' }, width: '304px', collapsible: true, hideOnly: true },
      render: () => <NavigatorPane />
    })

    ctx.registerSettingsPage({
      id: 'studio',
      title: 'Navigator Studio',
      icon: 'compass',
      order: 30,
      render: () => <NavigatorStudio />
    })

    ctx.register({
      id: 'open',
      area: PALETTE_AREA,
      data: { id: 'navigator.open', label: ctx.i18n.t('open'), keywords: ['navigator', 'sessions', 'destinations'], run: () => host.revealPane('navigator:pane') } satisfies PaletteContribution
    })
    ctx.register({
      id: 'studio',
      area: PALETTE_AREA,
      data: { id: 'navigator.studio', label: ctx.i18n.t('studio'), keywords: ['navigator', 'settings', 'customize'], run: () => host.navigate(pluginSettingsHref('navigator', 'studio')) } satisfies PaletteContribution
    })

    let removeDestinationCommands: (() => void) | undefined

    const registerDestinationCommands = (destinations: readonly SidebarDestination[]) => {
      removeDestinationCommands?.()
      removeDestinationCommands = ctx.registerMany(destinations.map(destination => ({
        id: destinationCommandId(destination.id),
        area: PALETTE_AREA,
        data: {
          id: `navigator.${destinationCommandId(destination.id)}`,
          label: `Open ${destination.label}`,
          keywords: ['navigator', 'destination', destination.label, destination.path],
          run: () => host.navigate(destination.path)
        } satisfies PaletteContribution
      })))
    }

    registerDestinationCommands(completeDestinations(host.sidebarNav.list()))
    ctx.onDispose(host.sidebarNav.subscribe(destinations => registerDestinationCommands(completeDestinations(destinations))))
    ctx.onDispose(() => removeDestinationCommands?.())

    // Data is requested only by mounted surfaces; event invalidation keeps their shared cache fresh.
  }
}

export default plugin
