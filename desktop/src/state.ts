import { atom, host, queryClient, type SidebarDestination } from '@hermes/plugin-sdk'

import {
  DEFAULT_NAVIGATOR_PREFERENCES,
  type NavigatorPreferences,
  type NavigatorProjectsTreePayload,
  type NavigatorSessionListPayload,
  normalizeNavigatorPreferences,
  parseProjectsTreePayload,
  parseSessionListPayload
} from './domain'

export const NAVIGATOR_PREFS_KEY = 'preferences'
export const navigatorPreferences = atom<NavigatorPreferences>(DEFAULT_NAVIGATOR_PREFERENCES)
export const navigatorDestinations = atom<readonly SidebarDestination[]>([])

export function updateNavigatorPreferences(patch: Partial<NavigatorPreferences>): void {
  const next = normalizeNavigatorPreferences({ ...navigatorPreferences.get(), ...patch })
  navigatorPreferences.set(next)
  void storage?.set(NAVIGATOR_PREFS_KEY, next)
}

type NavigatorStorage = {
  get: (key: string, fallback: unknown) => unknown
  set: (key: string, value: unknown) => void
}
let storage: NavigatorStorage | null = null

export function hydrateNavigatorPreferences(pluginStorage: NavigatorStorage): void {
  storage = pluginStorage
  navigatorPreferences.set(normalizeNavigatorPreferences(pluginStorage.get(NAVIGATOR_PREFS_KEY, DEFAULT_NAVIGATOR_PREFERENCES)))
}

export const navigatorQueryKeys = {
  sessions: ['navigator', 'sessions'] as const,
  projects: ['navigator', 'projects'] as const
}

export async function fetchNavigatorSessions(): Promise<NavigatorSessionListPayload> {
  return parseSessionListPayload(await host.request('session.list', { limit: 200 }))
}

export async function fetchNavigatorProjects(): Promise<NavigatorProjectsTreePayload> {
  return parseProjectsTreePayload(await host.request('projects.tree', {}))
}

export function invalidateNavigatorData(eventType: string): void {
  if (eventType === 'sessions.changed') {
    void queryClient.invalidateQueries({ queryKey: navigatorQueryKeys.sessions })
  }

  if (eventType === 'projects.changed') {
    void queryClient.invalidateQueries({ queryKey: navigatorQueryKeys.projects })
  }
}
