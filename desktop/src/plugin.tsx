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

const plugin: HermesPlugin = {
  id: 'navigator',
  name: 'Navigator',
  description: 'A customizable destination and session navigator, stacked beside native Sessions.',
  defaultEnabled: true,
  register(ctx) {
    // Plugin-local strings are intentionally scoped through ctx.i18n; the core locale catalog remains untouched.
    ctx.i18n.register({ en: { open: 'Open Navigator', studio: 'Open Navigator Studio' } })
    hydrateNavigatorPreferences(ctx.storage)

    navigatorDestinations.set(host.sidebarNav.list())
    ctx.onDispose(host.sidebarNav.subscribe(destinations => navigatorDestinations.set(destinations)))
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

    registerDestinationCommands(host.sidebarNav.list())
    ctx.onDispose(host.sidebarNav.subscribe(registerDestinationCommands))
    ctx.onDispose(() => removeDestinationCommands?.())

    // Data is requested only by mounted surfaces; event invalidation keeps their shared cache fresh.
  }
}

export default plugin
