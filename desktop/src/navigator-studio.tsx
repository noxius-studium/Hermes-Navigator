import {
  Button,
  Codicon,
  Input,
  ListRow,
  SearchField,
  SegmentedControl,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  useValue
} from '@hermes/plugin-sdk'
import { useMemo, useState } from 'react'

import { DEFAULT_NAVIGATOR_PREFERENCES, type NavigatorCategory, projectDestinations } from './domain'
import { navigatorDestinations, navigatorPreferences, updateNavigatorPreferences } from './state'

const PRESETS = [
  { id: 'peek', label: 'Peek', description: 'Sessions first. Favourite destinations stay compact.' },
  { id: 'atlas', label: 'Atlas', description: 'The More view groups destinations into categories.' }
]

export function NavigatorStudio() {
  const preferences = useValue(navigatorPreferences)
  const sourceDestinations = useValue(navigatorDestinations)
  const [filter, setFilter] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const catalog = useMemo(() => projectDestinations(sourceDestinations, preferences), [sourceDestinations, preferences])
  const needle = filter.trim().toLocaleLowerCase()
  const destinations = catalog.all.filter(item => !needle || `${item.label} ${item.path}`.toLocaleLowerCase().includes(needle))

  const applyPreset = (layoutPreset: string) => {
    if (layoutPreset === 'peek') {
      updateNavigatorPreferences({ density: 'compact', labels: 'selected', layoutPreset: 'peek' })
    } else if (layoutPreset === 'atlas') {
      updateNavigatorPreferences({ density: 'compact', labels: 'always', layoutPreset: 'atlas' })
    }
  }

  const setCategory = (id: string, category: NavigatorCategory) => {
    updateNavigatorPreferences({ categoryOverrides: { ...preferences.categoryOverrides, [id]: category }, layoutPreset: 'custom' })
  }

  const toggle = (id: string, field: 'favoriteIds' | 'hiddenIds') => {
    const values = preferences[field]

    if (field === 'favoriteIds' && !values.includes(id) && values.length >= 6) {return}
    updateNavigatorPreferences({
      [field]: values.includes(id) ? values.filter(value => value !== id) : [...values, id],
      layoutPreset: 'custom'
    })
  }

  const move = (id: string, direction: -1 | 1) => {
    const ordered = preferences.orderedDestinationIds.length
      ? [...preferences.orderedDestinationIds]
      : catalog.all.map(item => item.id)

    const index = ordered.indexOf(id)
    const target = index + direction

    if (index < 0 || target < 0 || target >= ordered.length) {
      return
    }

    ;[ordered[index], ordered[target]] = [ordered[target], ordered[index]]
    updateNavigatorPreferences({ orderedDestinationIds: ordered, layoutPreset: 'custom' })
  }

  const replaceCategory = (id: string, patch: { label?: string; hidden?: boolean }) => {
    updateNavigatorPreferences({
      categories: preferences.categories.map(category => category.id === id ? { ...category, ...patch } : category),
      layoutPreset: 'atlas'
    })
  }

  const deleteCategory = (id: string) => {
    updateNavigatorPreferences({
      categories: preferences.categories.filter(category => category.id !== id),
      layoutPreset: 'atlas'
    })
  }

  const addCategory = () => {
    const label = newCategory.trim()

    if (!label) {return}
    const base = label.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'category'
    let id = base
    let suffix = 2

    while (preferences.categories.some(category => category.id === id)) {id = `${base}-${suffix++}`}
    updateNavigatorPreferences({
      categories: [...preferences.categories, { id, label, icon: 'folder', hidden: false }],
      layoutPreset: 'atlas'
    })
    setNewCategory('')
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-5">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Navigator Studio</h1>
          <p className="mt-1 text-sm text-(--ui-text-secondary)">Choose what Navigator shows and how destinations are arranged.</p>
        </div>
        <Button onClick={() => updateNavigatorPreferences(DEFAULT_NAVIGATOR_PREFERENCES)} variant="outline">Reset</Button>
      </header>

      <section className="border-b border-(--ui-stroke-tertiary) py-5">
        <h2 className="text-sm font-medium text-foreground">Layout</h2>
        <p className="mt-1 text-xs text-(--ui-text-tertiary)">All layouts keep the same Sessions and More structure.</p>
        <div className="mt-3">
          <SegmentedControl
            aria-label="Navigator layout"
            onChange={applyPreset}
            options={PRESETS.map(({ id, label }) => ({ id, label }))}
            value={preferences.layoutPreset === 'custom' ? 'peek' : preferences.layoutPreset}
          />
          <p className="mt-2 text-sm text-(--ui-text-secondary)">
            {preferences.layoutPreset === 'custom'
              ? 'Custom destination choices are active.'
              : PRESETS.find(item => item.id === preferences.layoutPreset)?.description}
          </p>
        </div>
      </section>

      <section className="border-b border-(--ui-stroke-tertiary) py-5">
        <h2 className="mb-2 text-sm font-medium text-foreground">Presentation</h2>
        <div className="space-y-1">
          <ListRow
            action={<SegmentedControl onChange={density => updateNavigatorPreferences({ density: density as typeof preferences.density })} options={[{ id: 'compact', label: 'Compact' }, { id: 'comfortable', label: 'Comfortable' }]} value={preferences.density} />}
            description="Change session row spacing."
            title="Density"
          />
          <ListRow
            action={<SegmentedControl onChange={labels => updateNavigatorPreferences({ labels: labels as typeof preferences.labels, layoutPreset: 'custom' })} options={[{ id: 'selected', label: 'Selected' }, { id: 'always', label: 'Always' }, { id: 'icons', label: 'Icons' }]} value={preferences.labels} />}
            description="Control labels on favourite destinations."
            title="Favourite labels"
          />
          <ListRow
            action={<Switch aria-label="Live badges" checked={preferences.liveBadges} onCheckedChange={liveBadges => updateNavigatorPreferences({ liveBadges })} />}
            description="Show running, unread, and attention states on sessions."
            title="Live session badges"
          />
        </div>
      </section>

      <section className="border-b border-(--ui-stroke-tertiary) py-5">
        <h2 className="text-sm font-medium text-foreground">New destinations</h2>
        <p className="mt-1 text-xs text-(--ui-text-tertiary)">Choose where newly installed plugin pages appear.</p>
        <div className="mt-3">
          <SegmentedControl
            aria-label="New destination policy"
            onChange={newDestinationPolicy => updateNavigatorPreferences({ newDestinationPolicy: newDestinationPolicy as typeof preferences.newDestinationPolicy })}
            options={[{ id: 'more', label: 'Add to More' }, { id: 'visible', label: 'Show' }, { id: 'hidden', label: 'Hide' }]}
            value={preferences.newDestinationPolicy}
          />
        </div>
      </section>

      <section className="border-b border-(--ui-stroke-tertiary) py-5">
        <h2 className="text-sm font-medium text-foreground">Atlas categories</h2>
        <p className="mt-1 text-xs text-(--ui-text-tertiary)">Rename, hide, delete, or add lanes. Destinations in a removed lane move to the fallback lane.</p>
        <div className="mt-3 divide-y divide-(--ui-stroke-tertiary)">
          {preferences.categories.map(category => (
            <div className="flex items-center gap-2 py-2" key={category.id}>
              <Codicon className="text-(--ui-text-tertiary)" name={category.icon} />
              <Input aria-label={`Rename ${category.label}`} className="min-w-0 flex-1" onChange={event => replaceCategory(category.id, { label: event.target.value })} value={category.label} />
              <Button aria-label={`${category.hidden ? 'Show' : 'Hide'} ${category.label} category`} onClick={() => replaceCategory(category.id, { hidden: !category.hidden })} size="icon" variant="ghost"><Codicon name={category.hidden ? 'eye' : 'eye-closed'} /></Button>
              <Button aria-label={`Delete ${category.label} category`} disabled={preferences.categories.length === 1} onClick={() => deleteCategory(category.id)} size="icon" variant="ghost"><Codicon name="trash" /></Button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Input aria-label="New category name" onChange={event => setNewCategory(event.target.value)} placeholder="New category" value={newCategory} />
          <Button disabled={!newCategory.trim()} onClick={addCategory} variant="secondary">Add category</Button>
        </div>
      </section>

      <section className="py-5">
        <div className="flex items-end gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-medium text-foreground">Destinations <span className="ml-2 text-xs font-normal text-(--ui-text-tertiary)">{preferences.favoriteIds.length}/6 on Peek bar</span></h2>
            <p className="mt-1 text-xs text-(--ui-text-tertiary)">Choose up to 6 Peek-bar pages, hide items, assign Atlas categories, or reorder them.</p>
          </div>
          <div className="w-56"><SearchField aria-label="Search destinations" onChange={setFilter} placeholder="Filter pages" value={filter} /></div>
        </div>

        <div className="mt-3 divide-y divide-(--ui-stroke-tertiary)">
          {destinations.map(destination => (
            <div className="flex min-w-0 items-center gap-2 py-2" key={destination.id}>
              <Codicon className="shrink-0 text-(--ui-text-tertiary)" name={destination.codicon ?? 'circle-outline'} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-foreground">{destination.label}</div>
                <div className="truncate text-xs text-(--ui-text-tertiary)">{destination.path}</div>
              </div>
              <Select onValueChange={value => setCategory(destination.id, value as NavigatorCategory)} value={destination.category}>
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>{preferences.categories.map(category => <SelectItem key={category.id} value={category.id}>{category.label}</SelectItem>)}</SelectContent>
              </Select>
              <Button aria-label={`${destination.favorite ? 'Remove' : 'Add'} ${destination.label} favourite`} disabled={!destination.favorite && preferences.favoriteIds.length >= 6} onClick={() => toggle(destination.id, 'favoriteIds')} size="icon" variant="ghost"><Codicon name={destination.favorite ? 'star-full' : 'star-empty'} /></Button>
              <Button aria-label={`${destination.hidden ? 'Show' : 'Hide'} ${destination.label}`} onClick={() => toggle(destination.id, 'hiddenIds')} size="icon" variant="ghost"><Codicon name={destination.hidden ? 'eye' : 'eye-closed'} /></Button>
              <Button aria-label={`Move ${destination.label} up`} onClick={() => move(destination.id, -1)} size="icon" variant="ghost"><Codicon name="arrow-up" /></Button>
              <Button aria-label={`Move ${destination.label} down`} onClick={() => move(destination.id, 1)} size="icon" variant="ghost"><Codicon name="arrow-down" /></Button>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
