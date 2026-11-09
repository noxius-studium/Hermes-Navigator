# Installation

Hermes Navigator is a runtime Desktop plugin backed by three small host SDK seams that Hermes 0.23.0 does not expose yet. The guarded installer applies those seams to the pinned Hermes source checkout and installs `desktop/plugin.js` under `$HERMES_HOME/desktop-plugins/navigator/`.

## Requirements

- Hermes Agent source at commit `2bd378ed1b8d6bf2192cb26e0a55ff3091e6bd19`
- Node.js 22
- npm
- a clean Hermes source checkout

## Install

```sh
git clone https://github.com/noxius-studium/Hermes-Navigator.git
cd Hermes-Navigator
npm ci
npm run build
node scripts/install-host.mjs C:/Users/<you>/HermesHome/hermes-agent
cd C:/Users/<you>/HermesHome/hermes-agent/apps/desktop
npm run typecheck
npm run build
```

Restart Hermes Desktop after the build. Navigator loads from the normal on-disk plugin door and is enabled by default. Open **Settings → Plugins → Navigator → Navigator Studio** to choose Peek or Atlas and customize destinations.

The installer checks both the Hermes commit and working-tree cleanliness before copying anything. `--force` exists for maintainers who have reviewed the overlay against another revision; it is not a compatibility promise.

## Uninstall

Restore the Hermes checkout and remove the runtime plugin folder:

```sh
cd C:/Users/<you>/HermesHome/hermes-agent
git reset --hard HEAD
git clean -fd apps/desktop/src/plugins/navigator \
  apps/desktop/src/app/chat/sidebar/sidebar-core-destinations.ts \
  apps/desktop/src/app/chat/sidebar/sidebar-destinations.ts \
  apps/desktop/src/app/chat/sidebar/sidebar-destinations.test.ts
rm -rf C:/Users/<you>/HermesHome/desktop-plugins/navigator
cd apps/desktop
npm run build
```

Do not run the uninstall commands in a checkout containing unrelated uncommitted work.
