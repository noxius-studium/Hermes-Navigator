import { describe, expect, it } from 'vitest'

import {
  DEFAULT_NAVIGATOR_PREFERENCES,
  normalizeNavigatorPreferences,
  parseProjectsTreePayload,
  parseSessionListPayload,
  projectDestinations,
  searchSessions
} from './domain'

describe('Navigator domain', () => {
  it('normalizes only valid preference values and returns an immutable snapshot', () => {
    const preferences = normalizeNavigatorPreferences({
      layoutPreset: 'atlas',
      collapseBehavior: 'overlay',
      density: 'spacious',
      labels: 'always',
      liveBadges: false,
      rememberPerWorkspace: 'yes',
      newDestinationPolicy: 'hidden',
      orderedDestinationIds: ['messaging', 'messaging', '', 12, 'plugin:kanban:board'],
      hiddenIds: ['cron', 'cron', ' '],
      favoriteIds: ['plugin:kanban:board', 'messaging', 'plugin:kanban:board'],
      categoryOverrides: { messaging: 'operate', cron: 'invalid', '': 'build' }
    })

    expect(preferences).toEqual({
      ...DEFAULT_NAVIGATOR_PREFERENCES,
      layoutPreset: 'atlas',
      collapseBehavior: 'overlay',
      labels: 'always',
      liveBadges: false,
      newDestinationPolicy: 'hidden',
      orderedDestinationIds: ['messaging', 'plugin:kanban:board'],
      hiddenIds: ['cron'],
      favoriteIds: ['plugin:kanban:board', 'messaging'],
      categoryOverrides: { messaging: 'operate' }
    })
    expect(Object.isFrozen(preferences)).toBe(true)
    expect(Object.isFrozen(preferences.orderedDestinationIds)).toBe(true)
    expect(Object.isFrozen(preferences.categoryOverrides)).toBe(true)
    expect(() => (preferences.hiddenIds as string[]).push('artifacts')).toThrow(TypeError)
  })

  it('projects opaque destination ids into overridden categories, ordered favorites, and an all catalog', () => {
    const destinations: Parameters<typeof projectDestinations>[0] = [
      { id: 'capabilities', source: 'core', path: '/capabilities', label: 'Capabilities', codicon: 'symbol-misc' },
      { id: 'messaging', source: 'core', path: '/messaging', label: 'Messaging', codicon: 'comment' },
      { id: 'cron', source: 'core', path: '/cron', label: 'Scheduled jobs', codicon: 'watch' },
      { id: 'plugin:kanban:board', source: 'plugin:kanban', path: '/kanban', label: 'Kanban', codicon: 'project' },
      { id: 'plugin:future:inbox', source: 'plugin:future', path: '/inbox', label: 'Inbox', codicon: 'inbox' }
    ]

    const projection = projectDestinations(
      destinations,
      normalizeNavigatorPreferences({
        favoriteIds: ['plugin:kanban:board', 'messaging'],
        orderedDestinationIds: ['cron'],
        hiddenIds: ['plugin:future:inbox'],
        categoryOverrides: { messaging: 'operate' },
        newDestinationPolicy: 'more'
      })
    )

    expect(projection.visible.map(item => [item.id, item.category])).toEqual([
      ['plugin:kanban:board', 'more'],
      ['messaging', 'operate'],
      ['cron', 'operate'],
      ['capabilities', 'build']
    ])
    expect(projection.all.map(item => item.id)).toEqual([
      'plugin:kanban:board',
      'messaging',
      'cron',
      'capabilities',
      'plugin:future:inbox'
    ])
    expect(projection.all.at(-1)).toMatchObject({ id: 'plugin:future:inbox', category: 'more', hidden: true })
    expect(Object.isFrozen(projection.visible)).toBe(true)
    expect(Object.isFrozen(projection.visible[0])).toBe(true)
  })

  it('keeps chat-like plugin destinations policy-driven unless a user overrides them', () => {
    const chatLikePlugin: Parameters<typeof projectDestinations>[0] = [
      { id: 'plugin:inbox:chat', source: 'plugin:inbox', path: '/chat', label: 'Inbox chat', codicon: 'comment' }
    ]

    expect(
      projectDestinations(chatLikePlugin, normalizeNavigatorPreferences({ newDestinationPolicy: 'more' })).all[0]
    ).toMatchObject({ category: 'more', hidden: false })
    expect(
      projectDestinations(chatLikePlugin, normalizeNavigatorPreferences({ newDestinationPolicy: 'hidden' })).all[0]
    ).toMatchObject({ category: 'more', hidden: true })
    expect(
      projectDestinations(
        chatLikePlugin,
        normalizeNavigatorPreferences({ newDestinationPolicy: 'hidden', categoryOverrides: { 'plugin:inbox:chat': 'chats' } })
      ).all[0]
    ).toMatchObject({ category: 'chats', hidden: false })
  })

  it('searches bounded literal text across session labels and identifiers in stable recency order', () => {
    const sessions = [
      { id: 'stored-old', title: 'Design', preview: 'regex [draft]', project: 'Atlas', startedAt: 100 },
      { id: 'stored-missing', title: 'No timestamp', project: 'Atlas' },
      { id: 'stored-new', liveId: 'live-42', title: 'Deploy API', preview: 'watch release', cwd: '/work/atlas', startedAt: 300 },
      { id: 'stored-tied', title: 'Release notes', project: 'Atlas', startedAt: 300 },
      { id: 'stored-last', title: 'Notes', preview: 'nothing here' }
    ]

    expect(searchSessions(sessions, 'ATLAS').map(session => session.id)).toEqual([
      'stored-new',
      'stored-tied',
      'stored-old',
      'stored-missing'
    ])
    expect(sessions.map(session => session.id)).toEqual([
      'stored-old',
      'stored-missing',
      'stored-new',
      'stored-tied',
      'stored-last'
    ])
    expect(searchSessions(sessions, '[draft]').map(session => session.id)).toEqual(['stored-old'])
    expect(searchSessions(sessions, 'x'.repeat(513))).toEqual([])
  })

  it('parses only minimum valid session and project rows from unknown backend payloads', () => {
    expect(
      parseSessionListPayload({
        sessions: [
          { id: 'stored-1', resolved_id: 'live-1', title: 'One', preview: 'First', started_at: 42 },
          { id: '', title: 'Drop' },
          { id: 'stored-2', title: 4 }
        ]
      })
    ).toEqual({
      sessions: [{ id: 'stored-1', liveId: 'live-1', title: 'One', preview: 'First', startedAt: 42 }]
    })

    expect(
      parseProjectsTreePayload({
        active_id: 'project-1',
        projects: [
          {
            id: 'project-1',
            label: 'Atlas',
            path: '/work/atlas',
            previewSessions: [{ id: 'stored-1', title: 'One', preview: 'First', cwd: '/work/atlas' }]
          },
          { id: 2, label: 'Drop' }
        ]
      })
    ).toEqual({
      activeId: 'project-1',
      projects: [
        {
          id: 'project-1',
          label: 'Atlas',
          path: '/work/atlas',
          sessions: [{ id: 'stored-1', title: 'One', preview: 'First', cwd: '/work/atlas' }]
        }
      ]
    })
  })
})
