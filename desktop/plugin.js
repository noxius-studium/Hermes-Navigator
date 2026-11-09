// Generated from desktop/src by scripts/build.mjs. Do not edit directly.

// desktop/src/plugin.tsx
import {
  host as host5,
  PALETTE_AREA,
  pluginSettingsHref as pluginSettingsHref3
} from "@hermes/plugin-sdk";

// desktop/src/navigator-pane.tsx
import { useValue as useValue3 } from "@hermes/plugin-sdk";

// desktop/src/layout-mode-atlas.tsx
import {
  Button,
  Codicon as Codicon2,
  FadeScroll,
  host as host3,
  NativeNavigatorSessions,
  pluginSettingsHref,
  ProfileRail,
  useValue
} from "@hermes/plugin-sdk";
import { useEffect, useMemo, useState } from "react";

// desktop/src/domain.ts
function freezePreferences(preferences) {
  return Object.freeze({
    ...preferences,
    orderedDestinationIds: Object.freeze([...preferences.orderedDestinationIds]),
    hiddenIds: Object.freeze([...preferences.hiddenIds]),
    favoriteIds: Object.freeze([...preferences.favoriteIds]),
    pinnedSessionIds: Object.freeze([...preferences.pinnedSessionIds]),
    categories: Object.freeze(preferences.categories.map((category) => Object.freeze({ ...category }))),
    categoryOverrides: Object.freeze({ ...preferences.categoryOverrides })
  });
}
var DEFAULT_NAVIGATOR_PREFERENCES = freezePreferences({
  layoutPreset: "peek",
  collapseBehavior: "host",
  density: "compact",
  labels: "selected",
  liveBadges: true,
  rememberPerWorkspace: false,
  newDestinationPolicy: "more",
  orderedDestinationIds: [],
  hiddenIds: [],
  favoriteIds: [],
  pinnedSessionIds: [],
  categories: [
    { id: "chats", label: "Chats", icon: "comment-discussion", hidden: false },
    { id: "build", label: "Build", icon: "tools", hidden: false },
    { id: "operate", label: "Operate", icon: "shield", hidden: false },
    { id: "system", label: "System", icon: "settings-gear", hidden: false },
    { id: "more", label: "More", icon: "ellipsis", hidden: false }
  ],
  categoryOverrides: {}
});
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function enumValue(value, allowed, fallback) {
  return typeof value === "string" && allowed.includes(value) ? value : fallback;
}
function ids(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  const seen = /* @__PURE__ */ new Set();
  const result = [];
  for (const id of value) {
    if (typeof id !== "string" || !id.trim() || seen.has(id)) {
      continue;
    }
    seen.add(id);
    result.push(id);
  }
  return result;
}
function categoryDefinitions(value) {
  if (!Array.isArray(value)) {
    return DEFAULT_NAVIGATOR_PREFERENCES.categories;
  }
  const seen = /* @__PURE__ */ new Set();
  const result = [];
  for (const entry of value) {
    if (!isRecord(entry)) {
      continue;
    }
    const id = typeof entry.id === "string" ? entry.id.trim().slice(0, 64) : "";
    const label = typeof entry.label === "string" ? entry.label.trim().slice(0, 80) : "";
    if (!id || !label || seen.has(id)) {
      continue;
    }
    seen.add(id);
    result.push({
      id,
      label,
      icon: typeof entry.icon === "string" && entry.icon.trim() ? entry.icon.trim().slice(0, 64) : "folder",
      hidden: entry.hidden === true
    });
  }
  return result.length ? result : [{ id: "more", label: "More", icon: "ellipsis", hidden: false }];
}
function overrides(value, categoryIds) {
  if (!isRecord(value)) {
    return {};
  }
  const result = {};
  for (const [id, category] of Object.entries(value)) {
    if (id.trim() && typeof category === "string" && categoryIds.has(category)) {
      result[id] = category;
    }
  }
  return result;
}
function normalizeNavigatorPreferences(value) {
  const source = isRecord(value) ? value : {};
  const categories = categoryDefinitions(source.categories);
  const categoryIds = new Set(categories.map((category) => category.id));
  return freezePreferences({
    layoutPreset: enumValue(source.layoutPreset, ["peek", "atlas", "custom"], DEFAULT_NAVIGATOR_PREFERENCES.layoutPreset),
    collapseBehavior: enumValue(source.collapseBehavior, ["host", "compact", "overlay"], DEFAULT_NAVIGATOR_PREFERENCES.collapseBehavior),
    density: enumValue(source.density, ["compact", "comfortable"], DEFAULT_NAVIGATOR_PREFERENCES.density),
    labels: enumValue(source.labels, ["selected", "always", "icons"], DEFAULT_NAVIGATOR_PREFERENCES.labels),
    liveBadges: typeof source.liveBadges === "boolean" ? source.liveBadges : DEFAULT_NAVIGATOR_PREFERENCES.liveBadges,
    rememberPerWorkspace: typeof source.rememberPerWorkspace === "boolean" ? source.rememberPerWorkspace : DEFAULT_NAVIGATOR_PREFERENCES.rememberPerWorkspace,
    newDestinationPolicy: enumValue(source.newDestinationPolicy, ["more", "visible", "hidden"], DEFAULT_NAVIGATOR_PREFERENCES.newDestinationPolicy),
    orderedDestinationIds: ids(source.orderedDestinationIds),
    hiddenIds: ids(source.hiddenIds),
    favoriteIds: ids(source.favoriteIds),
    pinnedSessionIds: ids(source.pinnedSessionIds),
    categories,
    categoryOverrides: overrides(source.categoryOverrides, categoryIds)
  });
}
var coreDestinationCategories = {
  messaging: "chats",
  capabilities: "build",
  artifacts: "build",
  cron: "operate"
};
function automaticCategory(destination, policy) {
  const coreCategory = destination.source === "core" ? coreDestinationCategories[destination.id] : void 0;
  if (coreCategory) {
    return coreCategory;
  }
  return policy === "visible" ? "system" : "more";
}
function rank(ids2) {
  return new Map(ids2.map((id, index) => [id, index]));
}
function projectDestinations(destinations, preferences) {
  const favorites = rank(preferences.favoriteIds);
  const ordered = rank(preferences.orderedDestinationIds);
  const hidden = new Set(preferences.hiddenIds);
  const policyHidden = preferences.newDestinationPolicy === "hidden";
  const categoryIds = new Set(preferences.categories.map((category) => category.id));
  const fallbackCategory = categoryIds.has("more") ? "more" : preferences.categories[0]?.id ?? "more";
  const projected = destinations.map((destination, catalogIndex) => {
    const isUnknownPlugin = destination.source !== "core" && !preferences.categoryOverrides[destination.id];
    const item = {
      ...destination,
      category: (() => {
        const requested = preferences.categoryOverrides[destination.id] ?? automaticCategory(destination, preferences.newDestinationPolicy);
        return categoryIds.has(requested) ? requested : fallbackCategory;
      })(),
      hidden: hidden.has(destination.id) || policyHidden && isUnknownPlugin,
      favorite: favorites.has(destination.id)
    };
    return { item, catalogIndex };
  });
  projected.sort((a, b) => {
    const favoriteA = favorites.get(a.item.id);
    const favoriteB = favorites.get(b.item.id);
    const aFavorite = favoriteA !== void 0;
    const bFavorite = favoriteB !== void 0;
    if (aFavorite !== bFavorite) {
      return aFavorite ? -1 : 1;
    }
    if (aFavorite && bFavorite && favoriteA !== favoriteB) {
      return favoriteA - favoriteB;
    }
    const orderedA = ordered.get(a.item.id);
    const orderedB = ordered.get(b.item.id);
    if (orderedA !== void 0 || orderedB !== void 0) {
      if (orderedA === void 0) {
        return 1;
      }
      if (orderedB === void 0) {
        return -1;
      }
      if (orderedA !== orderedB) {
        return orderedA - orderedB;
      }
    }
    return a.catalogIndex - b.catalogIndex;
  });
  const all = Object.freeze(projected.map(({ item }) => Object.freeze(item)));
  return Object.freeze({ all, visible: Object.freeze(all.filter((item) => !item.hidden)) });
}

// desktop/src/layout-shared.tsx
import { Codicon, EmptyState, host } from "@hermes/plugin-sdk";
import { jsx, jsxs } from "react/jsx-runtime";
function DestinationRow({ destination }) {
  return /* @__PURE__ */ jsxs(
    "button",
    {
      "aria-label": `Open ${destination.label}`,
      className: "flex w-full min-w-0 items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-(--ui-text-secondary) hover:bg-(--chrome-action-hover) hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-(--ui-accent)",
      onClick: () => host.navigate(destination.path),
      type: "button",
      children: [
        /* @__PURE__ */ jsx(Codicon, { className: "shrink-0", name: destination.codicon ?? "circle-outline", size: "0.9rem" }),
        /* @__PURE__ */ jsx("span", { className: "truncate", children: destination.label })
      ]
    }
  );
}
function DestinationList({ destinations }) {
  if (!destinations.length) {
    return /* @__PURE__ */ jsx(EmptyState, { description: "Enabled plugin pages appear here automatically.", title: "No destinations found" });
  }
  return /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-0.5 px-2 py-2", children: destinations.map((destination) => /* @__PURE__ */ jsx(DestinationRow, { destination }, destination.id)) });
}

// desktop/src/state.ts
import { atom, host as host2, queryClient } from "@hermes/plugin-sdk";
var NAVIGATOR_PREFS_KEY = "preferences";
var navigatorPreferences = atom(DEFAULT_NAVIGATOR_PREFERENCES);
var navigatorDestinations = atom([]);
function updateNavigatorPreferences(patch) {
  const next = normalizeNavigatorPreferences({ ...navigatorPreferences.get(), ...patch });
  navigatorPreferences.set(next);
  void storage?.set(NAVIGATOR_PREFS_KEY, next);
}
var storage = null;
function hydrateNavigatorPreferences(pluginStorage) {
  storage = pluginStorage;
  navigatorPreferences.set(normalizeNavigatorPreferences(pluginStorage.get(NAVIGATOR_PREFS_KEY, DEFAULT_NAVIGATOR_PREFERENCES)));
}
var navigatorQueryKeys = {
  sessions: ["navigator", "sessions"],
  projects: ["navigator", "projects"]
};
function invalidateNavigatorData(eventType) {
  if (eventType === "sessions.changed") {
    void queryClient.invalidateQueries({ queryKey: navigatorQueryKeys.sessions });
  }
  if (eventType === "projects.changed") {
    void queryClient.invalidateQueries({ queryKey: navigatorQueryKeys.projects });
  }
}

// desktop/src/layout-mode-atlas.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function ModeAtlasLayout() {
  const preferences = useValue(navigatorPreferences);
  const source = useValue(navigatorDestinations);
  const [lane, setLane] = useState("sessions");
  const catalog = useMemo(() => projectDestinations(source, preferences), [preferences, source]);
  const lanes = useMemo(
    () => [
      { id: "sessions", icon: "comment-discussion", label: "Sessions" },
      ...preferences.categories.filter((category) => !category.hidden)
    ],
    [preferences.categories]
  );
  const current = lanes.find((item) => item.id === lane) ?? lanes[0];
  const destinations = lane === "sessions" ? [] : catalog.all.filter((item) => item.category === lane);
  useEffect(() => {
    if (!lanes.some((item) => item.id === lane)) {
      setLane("sessions");
    }
  }, [lane, lanes]);
  return /* @__PURE__ */ jsxs2("div", { className: "flex h-full min-h-0 overflow-hidden", children: [
    /* @__PURE__ */ jsxs2("aside", { className: "flex w-14 shrink-0 flex-col items-center gap-1 border-r border-(--ui-stroke-tertiary) bg-(--ui-sidebar-surface-background) px-1 py-2", children: [
      lanes.map((item) => /* @__PURE__ */ jsxs2("button", { "aria-label": item.label, className: `flex w-full flex-col items-center gap-0.5 rounded-md px-1 py-2 text-[0.5625rem] ${lane === item.id ? "bg-(--ui-control-active-background) text-(--ui-accent)" : "text-(--ui-text-tertiary) hover:bg-(--chrome-action-hover)"}`, onClick: () => setLane(item.id), type: "button", children: [
        /* @__PURE__ */ jsx2(Codicon2, { name: item.icon }),
        /* @__PURE__ */ jsx2("span", { className: "max-w-full truncate", children: item.label })
      ] }, item.id)),
      /* @__PURE__ */ jsx2("div", { className: "min-h-0 flex-1" }),
      /* @__PURE__ */ jsx2(Button, { "aria-label": "Navigator Studio", onClick: () => host3.navigate(pluginSettingsHref("navigator", "studio")), size: "icon", variant: "ghost", children: /* @__PURE__ */ jsx2(Codicon2, { name: "settings-gear" }) })
    ] }),
    /* @__PURE__ */ jsxs2("div", { className: "flex min-w-0 flex-1 flex-col overflow-hidden", children: [
      /* @__PURE__ */ jsxs2("header", { className: "flex h-11 shrink-0 items-center px-3", children: [
        /* @__PURE__ */ jsx2("span", { className: "flex-1 text-xs font-semibold uppercase tracking-wide text-(--ui-text-secondary)", children: current.label }),
        /* @__PURE__ */ jsx2(Button, { "aria-label": "Navigator Studio", onClick: () => host3.navigate(pluginSettingsHref("navigator", "studio")), size: "icon", variant: "ghost", children: /* @__PURE__ */ jsx2(Codicon2, { name: "settings-gear" }) })
      ] }),
      /* @__PURE__ */ jsx2("div", { className: "min-h-0 flex-1 overflow-hidden", children: lane === "sessions" ? /* @__PURE__ */ jsx2(NativeNavigatorSessions, {}) : /* @__PURE__ */ jsx2(FadeScroll, { className: "scrollbar-fade h-full", maxHeight: "none", children: /* @__PURE__ */ jsx2(DestinationList, { destinations }) }) }),
      lane !== "sessions" && /* @__PURE__ */ jsx2(ProfileRail, {})
    ] })
  ] });
}

// desktop/src/layout-peek-drawer.tsx
import {
  Button as Button2,
  Codicon as Codicon3,
  FadeScroll as FadeScroll2,
  host as host4,
  NativeNavigatorSessions as NativeNavigatorSessions2,
  pluginSettingsHref as pluginSettingsHref2,
  ProfileRail as ProfileRail2,
  useValue as useValue2
} from "@hermes/plugin-sdk";
import { useMemo as useMemo2, useState as useState2 } from "react";
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
function PeekDrawerLayout() {
  const preferences = useValue2(navigatorPreferences);
  const source = useValue2(navigatorDestinations);
  const [drawerOpen, setDrawerOpen] = useState2(false);
  const catalog = useMemo2(() => projectDestinations(source, preferences), [preferences, source]);
  const configured = catalog.visible.filter((item) => item.favorite);
  const favourites = configured.length ? configured : catalog.visible.slice(0, 6);
  return /* @__PURE__ */ jsxs3("div", { className: "flex h-full min-h-0 flex-col overflow-hidden", children: [
    /* @__PURE__ */ jsxs3("header", { className: "shrink-0 px-3 pb-2 pt-2", children: [
      /* @__PURE__ */ jsxs3("div", { className: "flex h-9 items-center", children: [
        /* @__PURE__ */ jsx3("span", { className: "flex-1 text-xs font-semibold uppercase tracking-wide text-(--ui-text-secondary)", children: "Workspace" }),
        /* @__PURE__ */ jsx3(Button2, { "aria-label": "Navigator Studio", onClick: () => host4.navigate(pluginSettingsHref2("navigator", "studio")), size: "icon", variant: "ghost", children: /* @__PURE__ */ jsx3(Codicon3, { name: "settings-gear" }) })
      ] }),
      /* @__PURE__ */ jsxs3("button", { className: "flex w-full items-center gap-2 rounded-md bg-(--ui-bg-quaternary) px-3 py-2 text-left text-xs text-(--ui-text-secondary) hover:bg-(--chrome-action-hover)", onClick: () => setDrawerOpen((value) => !value), type: "button", children: [
        /* @__PURE__ */ jsx3(Codicon3, { className: "text-(--ui-accent)", name: "symbol-keyword" }),
        /* @__PURE__ */ jsx3("span", { children: "Open destination" })
      ] }),
      /* @__PURE__ */ jsx3("div", { className: "mt-2 flex items-center gap-1 overflow-hidden", children: favourites.slice(0, 6).map((item) => item && /* @__PURE__ */ jsx3(Button2, { "aria-label": `Open ${item.label}`, onClick: () => host4.navigate(item.path), size: "icon", variant: "ghost", children: /* @__PURE__ */ jsx3(Codicon3, { name: item.codicon ?? "circle-outline" }) }, item.id)) })
    ] }),
    /* @__PURE__ */ jsx3("div", { className: "min-h-0 flex-1 overflow-hidden", children: drawerOpen ? /* @__PURE__ */ jsx3(FadeScroll2, { className: "scrollbar-fade h-full", maxHeight: "none", children: /* @__PURE__ */ jsx3(DestinationList, { destinations: catalog.all }) }) : /* @__PURE__ */ jsx3(NativeNavigatorSessions2, {}) }),
    drawerOpen && /* @__PURE__ */ jsx3(ProfileRail2, {})
  ] });
}

// desktop/src/navigator-pane.tsx
import { jsx as jsx4 } from "react/jsx-runtime";
function NavigatorPane() {
  const preferences = useValue3(navigatorPreferences);
  if (preferences.layoutPreset === "atlas") {
    return /* @__PURE__ */ jsx4(ModeAtlasLayout, {});
  }
  return /* @__PURE__ */ jsx4(PeekDrawerLayout, {});
}

// desktop/src/navigator-studio.tsx
import {
  Button as Button3,
  Codicon as Codicon4,
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
  useValue as useValue4
} from "@hermes/plugin-sdk";
import { useMemo as useMemo3, useState as useState3 } from "react";
import { jsx as jsx5, jsxs as jsxs4 } from "react/jsx-runtime";
var PRESETS = [
  { id: "peek", label: "Peek", description: "Sessions first. Favourite destinations stay compact." },
  { id: "atlas", label: "Atlas", description: "The More view groups destinations into categories." }
];
function NavigatorStudio() {
  const preferences = useValue4(navigatorPreferences);
  const sourceDestinations = useValue4(navigatorDestinations);
  const [filter, setFilter] = useState3("");
  const [newCategory, setNewCategory] = useState3("");
  const catalog = useMemo3(() => projectDestinations(sourceDestinations, preferences), [sourceDestinations, preferences]);
  const needle = filter.trim().toLocaleLowerCase();
  const destinations = catalog.all.filter((item) => !needle || `${item.label} ${item.path}`.toLocaleLowerCase().includes(needle));
  const applyPreset = (layoutPreset) => {
    if (layoutPreset === "peek") {
      updateNavigatorPreferences({ density: "compact", labels: "selected", layoutPreset: "peek" });
    } else if (layoutPreset === "atlas") {
      updateNavigatorPreferences({ density: "compact", labels: "always", layoutPreset: "atlas" });
    }
  };
  const setCategory = (id, category) => {
    updateNavigatorPreferences({ categoryOverrides: { ...preferences.categoryOverrides, [id]: category }, layoutPreset: "custom" });
  };
  const toggle = (id, field) => {
    const values = preferences[field];
    if (field === "favoriteIds" && !values.includes(id) && values.length >= 6) {
      return;
    }
    updateNavigatorPreferences({
      [field]: values.includes(id) ? values.filter((value) => value !== id) : [...values, id],
      layoutPreset: "custom"
    });
  };
  const move = (id, direction) => {
    const ordered = preferences.orderedDestinationIds.length ? [...preferences.orderedDestinationIds] : catalog.all.map((item) => item.id);
    const index = ordered.indexOf(id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) {
      return;
    }
    ;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    updateNavigatorPreferences({ orderedDestinationIds: ordered, layoutPreset: "custom" });
  };
  const replaceCategory = (id, patch) => {
    updateNavigatorPreferences({
      categories: preferences.categories.map((category) => category.id === id ? { ...category, ...patch } : category),
      layoutPreset: "atlas"
    });
  };
  const deleteCategory = (id) => {
    updateNavigatorPreferences({
      categories: preferences.categories.filter((category) => category.id !== id),
      layoutPreset: "atlas"
    });
  };
  const addCategory = () => {
    const label = newCategory.trim();
    if (!label) {
      return;
    }
    const base = label.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "category";
    let id = base;
    let suffix = 2;
    while (preferences.categories.some((category) => category.id === id)) {
      id = `${base}-${suffix++}`;
    }
    updateNavigatorPreferences({
      categories: [...preferences.categories, { id, label, icon: "folder", hidden: false }],
      layoutPreset: "atlas"
    });
    setNewCategory("");
  };
  return /* @__PURE__ */ jsxs4("main", { className: "mx-auto w-full max-w-3xl px-6 py-5", children: [
    /* @__PURE__ */ jsxs4("header", { className: "mb-6 flex items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxs4("div", { children: [
        /* @__PURE__ */ jsx5("h1", { className: "text-xl font-semibold text-foreground", children: "Navigator Studio" }),
        /* @__PURE__ */ jsx5("p", { className: "mt-1 text-sm text-(--ui-text-secondary)", children: "Choose what Navigator shows and how destinations are arranged." })
      ] }),
      /* @__PURE__ */ jsx5(Button3, { onClick: () => updateNavigatorPreferences(DEFAULT_NAVIGATOR_PREFERENCES), variant: "outline", children: "Reset" })
    ] }),
    /* @__PURE__ */ jsxs4("section", { className: "border-b border-(--ui-stroke-tertiary) py-5", children: [
      /* @__PURE__ */ jsx5("h2", { className: "text-sm font-medium text-foreground", children: "Layout" }),
      /* @__PURE__ */ jsx5("p", { className: "mt-1 text-xs text-(--ui-text-tertiary)", children: "All layouts keep the same Sessions and More structure." }),
      /* @__PURE__ */ jsxs4("div", { className: "mt-3", children: [
        /* @__PURE__ */ jsx5(
          SegmentedControl,
          {
            "aria-label": "Navigator layout",
            onChange: applyPreset,
            options: PRESETS.map(({ id, label }) => ({ id, label })),
            value: preferences.layoutPreset === "custom" ? "peek" : preferences.layoutPreset
          }
        ),
        /* @__PURE__ */ jsx5("p", { className: "mt-2 text-sm text-(--ui-text-secondary)", children: preferences.layoutPreset === "custom" ? "Custom destination choices are active." : PRESETS.find((item) => item.id === preferences.layoutPreset)?.description })
      ] })
    ] }),
    /* @__PURE__ */ jsxs4("section", { className: "border-b border-(--ui-stroke-tertiary) py-5", children: [
      /* @__PURE__ */ jsx5("h2", { className: "mb-2 text-sm font-medium text-foreground", children: "Presentation" }),
      /* @__PURE__ */ jsxs4("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx5(
          ListRow,
          {
            action: /* @__PURE__ */ jsx5(SegmentedControl, { onChange: (density) => updateNavigatorPreferences({ density }), options: [{ id: "compact", label: "Compact" }, { id: "comfortable", label: "Comfortable" }], value: preferences.density }),
            description: "Change session row spacing.",
            title: "Density"
          }
        ),
        /* @__PURE__ */ jsx5(
          ListRow,
          {
            action: /* @__PURE__ */ jsx5(SegmentedControl, { onChange: (labels) => updateNavigatorPreferences({ labels, layoutPreset: "custom" }), options: [{ id: "selected", label: "Selected" }, { id: "always", label: "Always" }, { id: "icons", label: "Icons" }], value: preferences.labels }),
            description: "Control labels on favourite destinations.",
            title: "Favourite labels"
          }
        ),
        /* @__PURE__ */ jsx5(
          ListRow,
          {
            action: /* @__PURE__ */ jsx5(Switch, { "aria-label": "Live badges", checked: preferences.liveBadges, onCheckedChange: (liveBadges) => updateNavigatorPreferences({ liveBadges }) }),
            description: "Show running, unread, and attention states on sessions.",
            title: "Live session badges"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs4("section", { className: "border-b border-(--ui-stroke-tertiary) py-5", children: [
      /* @__PURE__ */ jsx5("h2", { className: "text-sm font-medium text-foreground", children: "New destinations" }),
      /* @__PURE__ */ jsx5("p", { className: "mt-1 text-xs text-(--ui-text-tertiary)", children: "Choose where newly installed plugin pages appear." }),
      /* @__PURE__ */ jsx5("div", { className: "mt-3", children: /* @__PURE__ */ jsx5(
        SegmentedControl,
        {
          "aria-label": "New destination policy",
          onChange: (newDestinationPolicy) => updateNavigatorPreferences({ newDestinationPolicy }),
          options: [{ id: "more", label: "Add to More" }, { id: "visible", label: "Show" }, { id: "hidden", label: "Hide" }],
          value: preferences.newDestinationPolicy
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs4("section", { className: "border-b border-(--ui-stroke-tertiary) py-5", children: [
      /* @__PURE__ */ jsx5("h2", { className: "text-sm font-medium text-foreground", children: "Atlas categories" }),
      /* @__PURE__ */ jsx5("p", { className: "mt-1 text-xs text-(--ui-text-tertiary)", children: "Rename, hide, delete, or add lanes. Destinations in a removed lane move to the fallback lane." }),
      /* @__PURE__ */ jsx5("div", { className: "mt-3 divide-y divide-(--ui-stroke-tertiary)", children: preferences.categories.map((category) => /* @__PURE__ */ jsxs4("div", { className: "flex items-center gap-2 py-2", children: [
        /* @__PURE__ */ jsx5(Codicon4, { className: "text-(--ui-text-tertiary)", name: category.icon }),
        /* @__PURE__ */ jsx5(Input, { "aria-label": `Rename ${category.label}`, className: "min-w-0 flex-1", onChange: (event) => replaceCategory(category.id, { label: event.target.value }), value: category.label }),
        /* @__PURE__ */ jsx5(Button3, { "aria-label": `${category.hidden ? "Show" : "Hide"} ${category.label} category`, onClick: () => replaceCategory(category.id, { hidden: !category.hidden }), size: "icon", variant: "ghost", children: /* @__PURE__ */ jsx5(Codicon4, { name: category.hidden ? "eye" : "eye-closed" }) }),
        /* @__PURE__ */ jsx5(Button3, { "aria-label": `Delete ${category.label} category`, disabled: preferences.categories.length === 1, onClick: () => deleteCategory(category.id), size: "icon", variant: "ghost", children: /* @__PURE__ */ jsx5(Codicon4, { name: "trash" }) })
      ] }, category.id)) }),
      /* @__PURE__ */ jsxs4("div", { className: "mt-3 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx5(Input, { "aria-label": "New category name", onChange: (event) => setNewCategory(event.target.value), placeholder: "New category", value: newCategory }),
        /* @__PURE__ */ jsx5(Button3, { disabled: !newCategory.trim(), onClick: addCategory, variant: "secondary", children: "Add category" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs4("section", { className: "py-5", children: [
      /* @__PURE__ */ jsxs4("div", { className: "flex items-end gap-4", children: [
        /* @__PURE__ */ jsxs4("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxs4("h2", { className: "text-sm font-medium text-foreground", children: [
            "Destinations ",
            /* @__PURE__ */ jsxs4("span", { className: "ml-2 text-xs font-normal text-(--ui-text-tertiary)", children: [
              preferences.favoriteIds.length,
              "/6 on Peek bar"
            ] })
          ] }),
          /* @__PURE__ */ jsx5("p", { className: "mt-1 text-xs text-(--ui-text-tertiary)", children: "Choose up to 6 Peek-bar pages, hide items, assign Atlas categories, or reorder them." })
        ] }),
        /* @__PURE__ */ jsx5("div", { className: "w-56", children: /* @__PURE__ */ jsx5(SearchField, { "aria-label": "Search destinations", onChange: setFilter, placeholder: "Filter pages", value: filter }) })
      ] }),
      /* @__PURE__ */ jsx5("div", { className: "mt-3 divide-y divide-(--ui-stroke-tertiary)", children: destinations.map((destination) => /* @__PURE__ */ jsxs4("div", { className: "flex min-w-0 items-center gap-2 py-2", children: [
        /* @__PURE__ */ jsx5(Codicon4, { className: "shrink-0 text-(--ui-text-tertiary)", name: destination.codicon ?? "circle-outline" }),
        /* @__PURE__ */ jsxs4("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsx5("div", { className: "truncate text-sm text-foreground", children: destination.label }),
          /* @__PURE__ */ jsx5("div", { className: "truncate text-xs text-(--ui-text-tertiary)", children: destination.path })
        ] }),
        /* @__PURE__ */ jsxs4(Select, { onValueChange: (value) => setCategory(destination.id, value), value: destination.category, children: [
          /* @__PURE__ */ jsx5(SelectTrigger, { className: "w-24", children: /* @__PURE__ */ jsx5(SelectValue, {}) }),
          /* @__PURE__ */ jsx5(SelectContent, { children: preferences.categories.map((category) => /* @__PURE__ */ jsx5(SelectItem, { value: category.id, children: category.label }, category.id)) })
        ] }),
        /* @__PURE__ */ jsx5(Button3, { "aria-label": `${destination.favorite ? "Remove" : "Add"} ${destination.label} favourite`, disabled: !destination.favorite && preferences.favoriteIds.length >= 6, onClick: () => toggle(destination.id, "favoriteIds"), size: "icon", variant: "ghost", children: /* @__PURE__ */ jsx5(Codicon4, { name: destination.favorite ? "star-full" : "star-empty" }) }),
        /* @__PURE__ */ jsx5(Button3, { "aria-label": `${destination.hidden ? "Show" : "Hide"} ${destination.label}`, onClick: () => toggle(destination.id, "hiddenIds"), size: "icon", variant: "ghost", children: /* @__PURE__ */ jsx5(Codicon4, { name: destination.hidden ? "eye" : "eye-closed" }) }),
        /* @__PURE__ */ jsx5(Button3, { "aria-label": `Move ${destination.label} up`, onClick: () => move(destination.id, -1), size: "icon", variant: "ghost", children: /* @__PURE__ */ jsx5(Codicon4, { name: "arrow-up" }) }),
        /* @__PURE__ */ jsx5(Button3, { "aria-label": `Move ${destination.label} down`, onClick: () => move(destination.id, 1), size: "icon", variant: "ghost", children: /* @__PURE__ */ jsx5(Codicon4, { name: "arrow-down" }) })
      ] }, destination.id)) })
    ] })
  ] });
}

// desktop/src/plugin.tsx
import { jsx as jsx6 } from "react/jsx-runtime";
var destinationCommandId = (id) => `destination:${id}`;
var plugin = {
  id: "navigator",
  name: "Navigator",
  description: "A customizable destination and session navigator, stacked beside native Sessions.",
  defaultEnabled: true,
  register(ctx) {
    ctx.i18n.register({ en: { open: "Open Navigator", studio: "Open Navigator Studio" } });
    hydrateNavigatorPreferences(ctx.storage);
    navigatorDestinations.set(host5.sidebarNav.list());
    ctx.onDispose(host5.sidebarNav.subscribe((destinations) => navigatorDestinations.set(destinations)));
    ctx.onEvent("sessions.changed", () => invalidateNavigatorData("sessions.changed"));
    ctx.onEvent("projects.changed", () => invalidateNavigatorData("projects.changed"));
    ctx.register({
      id: "pane",
      area: "panes",
      title: "Navigator",
      data: { placement: "left", dock: { pane: "sessions", pos: "center" }, width: "304px", collapsible: true, hideOnly: true },
      render: () => /* @__PURE__ */ jsx6(NavigatorPane, {})
    });
    ctx.registerSettingsPage({
      id: "studio",
      title: "Navigator Studio",
      icon: "compass",
      order: 30,
      render: () => /* @__PURE__ */ jsx6(NavigatorStudio, {})
    });
    ctx.register({
      id: "open",
      area: PALETTE_AREA,
      data: { id: "navigator.open", label: ctx.i18n.t("open"), keywords: ["navigator", "sessions", "destinations"], run: () => host5.revealPane("navigator:pane") }
    });
    ctx.register({
      id: "studio",
      area: PALETTE_AREA,
      data: { id: "navigator.studio", label: ctx.i18n.t("studio"), keywords: ["navigator", "settings", "customize"], run: () => host5.navigate(pluginSettingsHref3("navigator", "studio")) }
    });
    let removeDestinationCommands;
    const registerDestinationCommands = (destinations) => {
      removeDestinationCommands?.();
      removeDestinationCommands = ctx.registerMany(destinations.map((destination) => ({
        id: destinationCommandId(destination.id),
        area: PALETTE_AREA,
        data: {
          id: `navigator.${destinationCommandId(destination.id)}`,
          label: `Open ${destination.label}`,
          keywords: ["navigator", "destination", destination.label, destination.path],
          run: () => host5.navigate(destination.path)
        }
      })));
    };
    registerDestinationCommands(host5.sidebarNav.list());
    ctx.onDispose(host5.sidebarNav.subscribe(registerDestinationCommands));
    ctx.onDispose(() => removeDestinationCommands?.());
  }
};
var plugin_default = plugin;
export {
  plugin_default as default
};
