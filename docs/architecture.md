# Architecture

## Principle

Navigator is additive. Hermes remains authoritative for sessions, projects, profile selection, routes, plugin registration, keybindings, and page ownership. Navigator changes only how those existing capabilities are reached.

## Data flow

1. Hermes core destinations and `sidebarNav` contributions form an immutable raw catalog.
2. `host.sidebarNav.list()` supplies the initial snapshot; `subscribe()` publishes registry or locale changes.
3. Navigator projects that catalog through local preferences: labels, order, visibility, Peek shortcuts, and Atlas categories.
4. Peek and Atlas navigate through `host.navigate()` rather than mounting destination pages inside the navigator pane.
5. The Sessions lane renders the real `ChatSidebar` tree with only its app-navigation rows suppressed. Folder drill-down, project collapse state, search, context menus, pagination, virtualization, pinned sessions, and profile ownership therefore stay native.

## Layouts

### Peek

Peek places the native Sessions browser in the remaining pane height. A compact shortcut bar supports at most six user-selected destinations. The `Open destination` control opens a full-height list; there is no synthetic ellipsis destination.

### Atlas

Atlas uses a narrow category rail and a content lane. Sessions is a fixed lane. User categories can be created, named, reordered, hidden, and removed; destinations assigned to a removed category fall back to the first available category.

## Storage

Navigator preferences live in plugin-scoped Hermes storage under schema version 3. Hydration normalizes unknown and legacy data rather than trusting it directly.

## Host overlay

The version-pinned host overlay introduces the smallest required seams while Navigator itself stays in the normal on-disk runtime plugin door:

- a shared core destination declaration used by both the stock sidebar and the SDK catalog;
- `host.sidebarNav` read/subscribe access;
- `NativeNavigatorSessions` and `ProfileRail` SDK exports;
- a `hideNavigation` option on the existing Sidebar surface.

No independent session or route implementation is introduced.
