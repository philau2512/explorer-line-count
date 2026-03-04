# Change Log

All notable changes to the "explorer-line-count" extension will be documented in this file.

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