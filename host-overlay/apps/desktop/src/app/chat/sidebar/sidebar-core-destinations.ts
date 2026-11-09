import { ARTIFACTS_ROUTE, CAPABILITIES_ROUTE, CRON_ROUTE, MESSAGING_ROUTE } from '@/app/routes'
import type { InterfaceTier } from '@/store/interface-mode'

/** Route-backed core sidebar rows shared by the native sidebar and SDK catalog. */
export interface CoreSidebarDestination {
  id: 'artifacts' | 'capabilities' | 'cron' | 'messaging'
  path: string
  codicon: string
  tier?: InterfaceTier
}

export const CORE_SIDEBAR_DESTINATIONS: readonly CoreSidebarDestination[] = Object.freeze([
  { id: 'capabilities', path: CAPABILITIES_ROUTE, codicon: 'symbol-misc' },
  { id: 'messaging', path: MESSAGING_ROUTE, codicon: 'comment' },
  { id: 'artifacts', path: ARTIFACTS_ROUTE, codicon: 'files', tier: 'advanced' },
  { id: 'cron', path: CRON_ROUTE, codicon: 'watch', tier: 'advanced' }
])
