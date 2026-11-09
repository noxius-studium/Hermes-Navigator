import { Codicon, EmptyState, host, type SidebarDestination } from '@hermes/plugin-sdk'

import type { NavigatorDestination } from './domain'

export function DestinationRow({ destination }: { destination: NavigatorDestination | SidebarDestination }) {
  return (
    <button
      aria-label={`Open ${destination.label}`}
      className="flex w-full min-w-0 items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-(--ui-text-secondary) hover:bg-(--chrome-action-hover) hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-(--ui-accent)"
      onClick={() => host.navigate(destination.path)}
      type="button"
    >
      <Codicon className="shrink-0" name={destination.codicon ?? 'circle-outline'} size="0.9rem" />
      <span className="truncate">{destination.label}</span>
    </button>
  )
}

export function DestinationList({ destinations }: { destinations: readonly NavigatorDestination[] }) {
  if (!destinations.length) {
    return <EmptyState description="Enabled plugin pages appear here automatically." title="No destinations found" />
  }

  return <div className="flex flex-col gap-0.5 px-2 py-2">{destinations.map(destination => <DestinationRow destination={destination} key={destination.id} />)}</div>
}
