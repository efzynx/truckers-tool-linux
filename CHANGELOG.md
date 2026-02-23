# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-23

### Added
- **Save Filtering & Sorting:** Players can now filter save files by type (All, Autosave, Manual) and sort them by date (Newest or Oldest) in the new save selection screen.
- **Dedicated SaveList Component:** Extracted save selection into its own component with a dedicated interface, separate from profile selection, for improved usability.
- **Save Scanning Endpoints:** Added new `/api/scan-saves` backend endpoint to scan physical `game.sii` directories and differentiate autosaves and manual saves.

### Changed
- **Save Selection Flow:** Transitioned from a simple backup toggle in the profile list to a comprehensive save selection step before decrypting data.
- **Mobile Navigation Bar:** Updated the mobile bottom navigation bar CSS to fully use `fixed` positioning, solving scroll-related layout clipping on long pages.
- **Version Bump:** Upgraded application version to stable `1.0.0` for release.

### Fixed
- **Mobile Header Overlap:** Fixed an issue where the main Profile ID sticky header overlapped with specific editor sub-headers (Economy, Skills, Garage) on small/mobile screens.

