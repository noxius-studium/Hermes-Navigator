import type { SidebarDestination } from '@hermes/plugin-sdk'

export type NavigatorLayoutPreset = 'peek' | 'atlas' | 'custom'
export type NavigatorCollapseBehavior = 'host' | 'compact' | 'overlay'
export type NavigatorDensity = 'compact' | 'comfortable'
export type NavigatorLabels = 'selected' | 'always' | 'icons'
export type NavigatorNewDestinationPolicy = 'more' | 'visible' | 'hidden'
export type NavigatorCategory = string

export interface NavigatorCategoryDefinition {
  readonly id: string
  readonly label: string
  readonly icon: string
  readonly hidden: boolean
}

export interface NavigatorPreferences {
  readonly layoutPreset: NavigatorLayoutPreset
  readonly collapseBehavior: NavigatorCollapseBehavior
  readonly density: NavigatorDensity
  readonly labels: NavigatorLabels
  readonly liveBadges: boolean
  readonly rememberPerWorkspace: boolean
  readonly newDestinationPolicy: NavigatorNewDestinationPolicy
  readonly orderedDestinationIds: readonly string[]
  readonly hiddenIds: readonly string[]
  readonly favoriteIds: readonly string[]
  readonly pinnedSessionIds: readonly string[]
  readonly categories: readonly NavigatorCategoryDefinition[]
  readonly categoryOverrides: Readonly<Record<string, NavigatorCategory>>
}

function freezePreferences(preferences: NavigatorPreferences): NavigatorPreferences {
  return Object.freeze({
    ...preferences,
    orderedDestinationIds: Object.freeze([...preferences.orderedDestinationIds]),
    hiddenIds: Object.freeze([...preferences.hiddenIds]),
    favoriteIds: Object.freeze([...preferences.favoriteIds]),
    pinnedSessionIds: Object.freeze([...preferences.pinnedSessionIds]),
    categories: Object.freeze(preferences.categories.map(category => Object.freeze({ ...category }))),
    categoryOverrides: Object.freeze({ ...preferences.categoryOverrides })
  })
}

export const DEFAULT_NAVIGATOR_PREFERENCES: NavigatorPreferences = freezePreferences({
  layoutPreset: 'peek',
  collapseBehavior: 'host',
  density: 'compact',
  labels: 'selected',
  liveBadges: true,
  rememberPerWorkspace: false,
  newDestinationPolicy: 'more',
  orderedDestinationIds: [],
  hiddenIds: [],
  favoriteIds: [],
  pinnedSessionIds: [],
  categories: [
    { id: 'chats', label: 'Chats', icon: 'comment-discussion', hidden: false },
    { id: 'build', label: 'Build', icon: 'tools', hidden: false },
    { id: 'operate', label: 'Operate', icon: 'shield', hidden: false },
    { id: 'system', label: 'System', icon: 'settings-gear', hidden: false },
    { id: 'more', label: 'More', icon: 'ellipsis', hidden: false }
  ],
  categoryOverrides: {}
})

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && allowed.includes(value as T) ? (value as T) : fallback
}

function ids(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return []
  }

  const seen = new Set<string>()
  const result: string[] = []

  for (const id of value) {
    if (typeof id !== 'string' || !id.trim() || seen.has(id)) {
      continue
    }

    seen.add(id)
    result.push(id)
  }

  return result
}

function categoryDefinitions(value: unknown): readonly NavigatorCategoryDefinition[] {
  if (!Array.isArray(value)) {
    return DEFAULT_NAVIGATOR_PREFERENCES.categories
  }

  const seen = new Set<string>()
  const result: NavigatorCategoryDefinition[] = []

  for (const entry of value) {
    if (!isRecord(entry)) {continue}
    const id = typeof entry.id === 'string' ? entry.id.trim().slice(0, 64) : ''
    const label = typeof entry.label === 'string' ? entry.label.trim().slice(0, 80) : ''

    if (!id || !label || seen.has(id)) {continue}
    seen.add(id)
    result.push({
      id,
      label,
      icon: typeof entry.icon === 'string' && entry.icon.trim() ? entry.icon.trim().slice(0, 64) : 'folder',
      hidden: entry.hidden === true
    })
  }

  return result.length ? result : [{ id: 'more', label: 'More', icon: 'ellipsis', hidden: false }]
}

function overrides(value: unknown, categoryIds: ReadonlySet<string>): Readonly<Record<string, NavigatorCategory>> {
  if (!isRecord(value)) {
    return {}
  }

  const result: Record<string, NavigatorCategory> = {}

  for (const [id, category] of Object.entries(value)) {
    if (id.trim() && typeof category === 'string' && categoryIds.has(category)) {
      result[id] = category as NavigatorCategory
    }
  }

  return result
}

/** Strictly accepts persisted preference values the Navigator understands. */
export function normalizeNavigatorPreferences(value: unknown): NavigatorPreferences {
  const source = isRecord(value) ? value : {}
  const categories = categoryDefinitions(source.categories)
  const categoryIds = new Set(categories.map(category => category.id))

  return freezePreferences({
    layoutPreset: enumValue(source.layoutPreset, ['peek', 'atlas', 'custom'], DEFAULT_NAVIGATOR_PREFERENCES.layoutPreset),
    collapseBehavior: enumValue(source.collapseBehavior, ['host', 'compact', 'overlay'], DEFAULT_NAVIGATOR_PREFERENCES.collapseBehavior),
    density: enumValue(source.density, ['compact', 'comfortable'], DEFAULT_NAVIGATOR_PREFERENCES.density),
    labels: enumValue(source.labels, ['selected', 'always', 'icons'], DEFAULT_NAVIGATOR_PREFERENCES.labels),
    liveBadges: typeof source.liveBadges === 'boolean' ? source.liveBadges : DEFAULT_NAVIGATOR_PREFERENCES.liveBadges,
    rememberPerWorkspace:
      typeof source.rememberPerWorkspace === 'boolean'
        ? source.rememberPerWorkspace
        : DEFAULT_NAVIGATOR_PREFERENCES.rememberPerWorkspace,
    newDestinationPolicy: enumValue(source.newDestinationPolicy, ['more', 'visible', 'hidden'], DEFAULT_NAVIGATOR_PREFERENCES.newDestinationPolicy),
    orderedDestinationIds: ids(source.orderedDestinationIds),
    hiddenIds: ids(source.hiddenIds),
    favoriteIds: ids(source.favoriteIds),
    pinnedSessionIds: ids(source.pinnedSessionIds),
    categories,
    categoryOverrides: overrides(source.categoryOverrides, categoryIds)
  })
}

export interface NavigatorDestination extends SidebarDestination {
  readonly category: NavigatorCategory
  readonly hidden: boolean
  readonly favorite: boolean
}

export interface NavigatorDestinationProjection {
  readonly all: readonly NavigatorDestination[]
  readonly visible: readonly NavigatorDestination[]
}

const coreDestinationCategories: Readonly<Record<string, NavigatorCategory>> = {
  messaging: 'chats',
  capabilities: 'build',
  artifacts: 'build',
  cron: 'operate'
}

function automaticCategory(destination: SidebarDestination, policy: NavigatorNewDestinationPolicy): NavigatorCategory {
  const coreCategory = destination.source === 'core' ? coreDestinationCategories[destination.id] : undefined

  if (coreCategory) {
    return coreCategory
  }

  return policy === 'visible' ? 'system' : 'more'
}

function rank(ids: readonly string[]): Map<string, number> {
  return new Map(ids.map((id, index) => [id, index]))
}

/** Categorize catalog destinations without interpreting opaque destination IDs. */
export function projectDestinations(
  destinations: readonly SidebarDestination[],
  preferences: NavigatorPreferences
): NavigatorDestinationProjection {
  const favorites = rank(preferences.favoriteIds)
  const ordered = rank(preferences.orderedDestinationIds)
  const hidden = new Set(preferences.hiddenIds)
  const policyHidden = preferences.newDestinationPolicy === 'hidden'
  const categoryIds = new Set(preferences.categories.map(category => category.id))
  const fallbackCategory = categoryIds.has('more') ? 'more' : preferences.categories[0]?.id ?? 'more'

  const projected = destinations.map((destination, catalogIndex) => {
    const isUnknownPlugin = destination.source !== 'core' && !preferences.categoryOverrides[destination.id]

    const item: NavigatorDestination = {
      ...destination,
      category: (() => {
        const requested = preferences.categoryOverrides[destination.id] ?? automaticCategory(destination, preferences.newDestinationPolicy)

        return categoryIds.has(requested) ? requested : fallbackCategory
      })(),
      hidden: hidden.has(destination.id) || (policyHidden && isUnknownPlugin),
      favorite: favorites.has(destination.id)
    }

    return { item, catalogIndex }
  })

  projected.sort((a, b) => {
    const favoriteA = favorites.get(a.item.id)
    const favoriteB = favorites.get(b.item.id)
    const aFavorite = favoriteA !== undefined
    const bFavorite = favoriteB !== undefined

    if (aFavorite !== bFavorite) {
      return aFavorite ? -1 : 1
    }

    if (aFavorite && bFavorite && favoriteA !== favoriteB) {
      return favoriteA! - favoriteB!
    }

    const orderedA = ordered.get(a.item.id)
    const orderedB = ordered.get(b.item.id)

    if (orderedA !== undefined || orderedB !== undefined) {
      if (orderedA === undefined) {
        return 1
      }

      if (orderedB === undefined) {
        return -1
      }

      if (orderedA !== orderedB) {
        return orderedA - orderedB
      }
    }

    return a.catalogIndex - b.catalogIndex
  })

  const all = Object.freeze(projected.map(({ item }) => Object.freeze(item)))

  return Object.freeze({ all, visible: Object.freeze(all.filter(item => !item.hidden)) })
}

export interface NavigatorSession {
  readonly id: string
  readonly liveId?: string
  readonly title?: string
  readonly preview?: string
  readonly cwd?: string
  readonly project?: string
  readonly startedAt?: number
}

const MAX_SESSION_SEARCH_LENGTH = 512

/**
 * Literal, case-insensitive client-side search over already fetched session rows.
 * Results are newest first; equal or missing timestamps preserve input order, with missing timestamps last.
 */
export function searchSessions(sessions: readonly NavigatorSession[], query: string): readonly NavigatorSession[] {
  if (typeof query !== 'string' || query.length > MAX_SESSION_SEARCH_LENGTH) {
    return []
  }

  const needle = query.toLocaleLowerCase()

  const matches = sessions.filter(session =>
    !needle ||
    [session.title, session.preview, session.id, session.liveId, session.cwd, session.project].some(
      value => typeof value === 'string' && value.toLocaleLowerCase().includes(needle)
    )
  )

  return matches
    .map((session, inputIndex) => ({ session, inputIndex }))
    .sort((a, b) => {
      const startedAtA = Number.isFinite(a.session.startedAt) ? a.session.startedAt! : Number.NEGATIVE_INFINITY
      const startedAtB = Number.isFinite(b.session.startedAt) ? b.session.startedAt! : Number.NEGATIVE_INFINITY

      return startedAtB - startedAtA || a.inputIndex - b.inputIndex
    })
    .map(({ session }) => session)
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function optionalString(value: unknown): string | undefined | null {
  return value === undefined || value === null || typeof value === 'string' ? value ?? undefined : null
}

function optionalNumber(value: unknown): number | undefined | null {
  return value === undefined || typeof value === 'number' && Number.isFinite(value) ? value : null
}

function parseSession(value: unknown): NavigatorSession | null {
  if (!isRecord(value) || !nonEmptyString(value.id)) {
    return null
  }

  const title = optionalString(value.title)
  const preview = optionalString(value.preview)
  const liveId = optionalString(value.resolved_id ?? value.live_id)
  const cwd = optionalString(value.cwd)
  const project = optionalString(value.project)
  const startedAt = optionalNumber(value.started_at)

  if (title === null || preview === null || liveId === null || cwd === null || project === null || startedAt === null) {
    return null
  }

  return {
    id: value.id,
    ...(liveId ? { liveId } : {}),
    ...(title ? { title } : {}),
    ...(preview ? { preview } : {}),
    ...(cwd ? { cwd } : {}),
    ...(project ? { project } : {}),
    ...(startedAt !== undefined ? { startedAt } : {})
  }
}

export interface NavigatorSessionListPayload {
  readonly sessions: readonly NavigatorSession[]
}

export function parseSessionListPayload(value: unknown): NavigatorSessionListPayload {
  const source = isRecord(value) && Array.isArray(value.sessions) ? value.sessions : []

  return { sessions: source.map(parseSession).filter((session): session is NavigatorSession => session !== null) }
}

export interface NavigatorProject {
  readonly id: string
  readonly label: string
  readonly path?: string
  readonly sessions: readonly NavigatorSession[]
}

export interface NavigatorProjectsTreePayload {
  readonly activeId?: string
  readonly projects: readonly NavigatorProject[]
}

function parseProject(value: unknown): NavigatorProject | null {
  if (!isRecord(value) || !nonEmptyString(value.id) || !nonEmptyString(value.label)) {
    return null
  }

  const path = optionalString(value.path)

  if (path === null) {
    return null
  }

  const sourceSessions = Array.isArray(value.previewSessions) ? value.previewSessions : []

  return {
    id: value.id,
    label: value.label,
    ...(path ? { path } : {}),
    sessions: sourceSessions.map(parseSession).filter((session): session is NavigatorSession => session !== null)
  }
}

export function parseProjectsTreePayload(value: unknown): NavigatorProjectsTreePayload {
  const source = isRecord(value) ? value : {}
  const activeId = optionalString(source.active_id)
  const projects = Array.isArray(source.projects) ? source.projects : []

  return {
    ...(activeId ? { activeId } : {}),
    projects: projects.map(parseProject).filter((project): project is NavigatorProject => project !== null)
  }
}
