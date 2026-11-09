# Limitations

- The current release is pinned to one Hermes Agent source revision and is not yet a catalog-installable runtime plugin.
- Installation modifies a Hermes source checkout and requires rebuilding Desktop.
- Runtime destinations appear only when their owning Desktop plugin is registered. Navigator never invents routes for plugins that are absent from the current device.
- Navigator customizes labels and placement only inside Navigator. It does not rename the owning plugin, route, settings page, or Hermes's stock sidebar entry.
- Sessions is deliberately not reimplemented. Any limitation of the native Sessions/Projects browser remains visible in Navigator.
- Peek supports at most six shortcuts. The complete destination catalog remains available through `Open destination` and the command palette.
- Navigator stores local UI preferences only; it does not synchronize them between machines or profiles.
