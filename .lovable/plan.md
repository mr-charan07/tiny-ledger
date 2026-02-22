

## Remove Architecture View from the Project

This plan removes the Architecture page/tab entirely from the application.

### Changes

1. **Delete `src/components/ArchitectureView.tsx`** -- Remove the entire component file.

2. **Edit `src/components/Sidebar.tsx`** -- Remove the `Layers` icon import and the `architecture` nav item from the `navItems` array.

3. **Edit `src/pages/Index.tsx`** -- Remove the lazy import for `ArchitectureView` and the `activeTab === 'architecture'` rendering line.

### What stays unchanged

- The `docs/` folder (`docs/architecture.md`, `docs/flowcharts.md`, `docs/README.md`) remains in the repo for GitHub documentation purposes.
- All other views (Dashboard, Record, Verify, Blocks, Devices, Permissions, Performance, Admin) are unaffected.

