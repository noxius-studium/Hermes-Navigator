import { SIDEBAR_NAV_AREA, type SidebarNavContribution } from '@/app/routes'
import { registry } from '@/contrib/registry'
import { $appLocaleVersion, subscribeRuntimeI18nLocale, translateNow } from '@/i18n'
import type { InterfaceTier } from '@/store/interface-mode'

import { CORE_SIDEBAR_DESTINATIONS } from './sidebar-core-destinations'

/** A raw sidebar destination, before interface-mode filtering or nav preferences. */
export interface SidebarDestination {
  /** Core ids are fixed; contributed ids are the final registry ids. Treat as opaque. */
  id: string
  source: 'core' | `plugin:${string}`
  path: string
  label: string
  codicon: string
  tier?: InterfaceTier
}

function coreDestinations(): SidebarDestination[] {
  return CORE_SIDEBAR_DESTINATIONS.map(destination => ({
    ...destination,
    source: 'core',
    label: translateNow(`sidebar.nav.${destination.id}`)
  }))
}

function contributedDestinations(): SidebarDestination[] {
  return registry.getArea(SIDEBAR_NAV_AREA).flatMap(contribution => {
    const data = contribution.data as Partial<SidebarNavContribution> | undefined
    const label = data?.label

    if (!data?.path?.startsWith('/') || typeof label !== 'string' || !label.trim()) {
      return []
    }

    return [
      {
        id: contribution.id,
        source: contribution.source?.startsWith('plugin:') ? (contribution.source as `plugin:${string}`) : 'core',
        path: data.path,
        label,
        codicon: typeof data.codicon === 'string' && data.codicon ? data.codicon : 'plug',
        tier: data.tier
      }
    ]
  })
}

function snapshotDestinations(destinations: readonly SidebarDestination[]): readonly SidebarDestination[] {
  return Object.freeze(destinations.map(destination => Object.freeze({ ...destination })))
}

export function listSidebarDestinations(): readonly SidebarDestination[] {
  return snapshotDestinations([...coreDestinations(), ...contributedDestinations()])
}

function sameDestinations(a: readonly SidebarDestination[], b: readonly SidebarDestination[]): boolean {
  return (
    a.length === b.length &&
    a.every(
      (destination, index) =>
        destination.id === b[index]?.id &&
        destination.source === b[index]?.source &&
        destination.path === b[index]?.path &&
        destination.label === b[index]?.label &&
        destination.codicon === b[index]?.codicon &&
        destination.tier === b[index]?.tier
    )
  )
}

/** Observe raw sidebar destinations. The listener receives its initial snapshot immediately. */
export function subscribeSidebarDestinations(listener: (destinations: readonly SidebarDestination[]) => void): () => void {
  let snapshot: readonly SidebarDestination[] = []

  const publishIfChanged = () => {
    const next = listSidebarDestinations()

    if (!sameDestinations(snapshot, next)) {
      snapshot = next
      listener(snapshot)
    }
  }

  // Subscribe before the initial callback: a listener can synchronously mutate
  // the registry, and that mutation must not fall into the setup gap.
  const stopArea = registry.subscribeArea(SIDEBAR_NAV_AREA, publishIfChanged)
  const stopLocale = subscribeRuntimeI18nLocale(publishIfChanged)
  const stopCatalog = $appLocaleVersion.listen(publishIfChanged)
  snapshot = listSidebarDestinations()
  listener(snapshot)
  publishIfChanged()

  return () => {
    stopArea()
    stopLocale()
    stopCatalog()
  }
}
