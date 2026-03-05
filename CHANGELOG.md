# Change Log

All notable changes to the "explorer-line-count" extension will be documented in this file.

## [0.0.6] - 2026-03-05

### Added & Fixed
- 🚀 **Status Bar Integration:** The active file's exact line count is now smoothly displayed on the bottom right Status Bar, bypassing Explorer's 2-character limits and offering quick insights at a glance.
- 🛠️ **Compatibility Fix:** Lowered the minimum required VS Code engine version to `1.90.0`. This ensures the extension works flawlessly on alternative IDEs like Cursor and older VS Code setups!

## [0.0.5] - 2026-03-05

### Added & Fixed
- 🌟 Dramatically expanded the default `allowedExtensions` list to support 40+ popular formats right out of the box (including `.mjs`, `.vue`, `.svelte`, `.cs`, `.php`, etc.).
- 🛠️ Fixed and improved the hover logic:
  - Files exceeding the `maxFileSize` limit will now hide their badge but accurately show a tooltip explaining the file limit.
  - Files with line counts below `minLineDisplay` will now successfully hide their numeric badge while still displaying the exact line count when you hover over them.

## [0.0.3] - 2026-03-05

### Added
- 🚀 Introduced a comprehensive Settings UI via `contributes.configuration`.
- Users can now customize `allowedExtensions` to target specific file types.
- Users can customize `ignoredFolders` to exclude heavy directories.
- Added `maxFileSize` setting (in MB) to prevent performance drops from large files.
- Added `minLineDisplay` setting to filter out badges for very small files while keeping hover tooltips active.

### Optimized
- Improved async file reading performance with smart caching.
- Optimized badge rendering (e.g., `1h`, `2k`) for a cleaner Explorer UI.
- Implemented debouncing for configuration changes to avoid unnecessary reloads.

## [0.0.2] - Initial Drafts

- Initial working prototype with hardcoded values.
- Basic VS Code File Decoration support.