# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [1.1.4-alpha.1] - 2026-03-19

### Added
- **Docs Button**: Added a Documentation button in the welcome screen header with dynamic links based on language.
- **Translations**: Added tooltip translations for the documentation button in both dictionaries.

### Fixed
- **Version Comparison**: Fixed `versionCompare` logic in `AboutModal.tsx` to handle pre-release hierarchies correctly, fixing invalid OTA status.

## [1.1.3] - 2026-03-19

### Added
- **Data Integrity System:** Added "Triple-Check" validation for SII files on load/save to prevent save corruption.
- **Advanced Profile Restore:** Overhauled restore with manual slot selector, live stats diff, and granular options.
- **Job Editor:** Dedicated view for active cargo, deadline resets, and 0% damage repairs.
- **Economy Reset:** Dashboard quick action button to instantly refresh Freight Market job listings.
- **Custom License Plates:** Personalized up to 8 characters editing for owned trucks with country formatting.
- **Telegram Bot Workflow:** Integrated CI/CD Telegram notify step with cleaner styling outputs and truncated logs.

### Fixed
- Core backend crashes, dialog HTML nesting hydration errors, overlaps, and modal position stability.

## [1.1.3-beta.4] - 2026-03-19

### Changed
- **Telegram Notification Bot:** Updated notification message template with a cleaner visual style, new emojis, and a truncated changelog summary (max 20 lines).

### Fixed
- **CI/CD Workflow:** Fixed YAML parse error (`Implicit keys need to be on a single line`) inside `.github/workflows/release.yml` by passing variables via Environment Variables (`env`) for stability.

## [1.1.3-beta.1] - 2026-03-18

### Added
- **Data Integrity System:** Implemented a robust "Triple-Check" validation system for SII files. The app now verifies brace balancing (`{ }`) and header validity (`SiiNunit`) both during loading and before writing to disk to prevent save game corruption.
- **Advanced Profile Restore:** Completely overhauled the restore functionality. Users can now choose specifically which backup save slot to restore from and which active slot to overwrite (Granular Restore).
- **Live Data Comparison (Diff):** Before confirming a restore, a detailed comparison table is shown, covering Money, XP, all 6 Skills, Assets (Trucks, Trailers, Garages, Drivers), Map discovery, and active Jobs.
- **Granular vs Nuclear Restore:** Added options to either restore a single save slot (Safe) or the entire profile directory including `profile.sii` (Nuclear).
- **Consistency & UX:** Success notifications for restore actions now use the same Emerald toast style as the Dashboard. Navigation is now seamless with background data refreshing, eliminating the need for full page reloads.
- **Full i18n Support:** Added comprehensive Indonesian and English translations for all restore-related interfaces and messages.
- **Job Editor / Management:** New dedicated view for active cargo. Easily reset delivery deadlines to gain maximum time or fix cargo damage completely to 0% to prevent delivery penalties.
- **Job Editor Consistency:** Aligned the header positioning for all internal sub-menus (Job, Profile, Driver, User) with the sidebar layout to fix overlapping visual bugs on desktop views.
- **Economy Reset:** Added a new "Economy Reset" quick action button to the Dashboard. Instantly refreshes the in-game Freight Market job list by advancing internal game time, fixing "no jobs available" issues commonly caused by mod changes.
- **Custom License Plates:** Added a custom license plate text input for player-owned trucks within the Truck Editor. Supports up to 8 characters and automatically preserves the truck's registered country formatting.

### Fixed
- **HTML Nesting Error:** Fixed a hydration warning where a button was nested within another button in the Profile List.
- **Backend Stability:** Fixed a critical server-side crash caused by missing variable initializations in the profile routes.
- **Custom License Plate Persistence:** Fixed an issue where the parser wouldn't save custom plate changes unless accompanied by a truck repair/refuel action.

## [1.1.3-alpha.3] - 2026-03-17

### Added
- **Data Integrity System:** Implemented a robust "Triple-Check" validation system for SII files. The app now verifies brace balancing (`{ }`) and header validity (`SiiNunit`) both during loading and before writing to disk to prevent save game corruption.
- **Advanced Profile Restore:** Completely overhauled the restore functionality. Users can now choose specifically which backup save slot to restore from and which active slot to overwrite (Granular Restore). 
- **Live Data Comparison (Diff):** Before confirming a restore, a detailed comparison table is shown, covering Money, XP, all 6 Skills, Assets (Trucks, Trailers, Garages, Drivers), Map discovery, and active Jobs.
- **Granular vs Nuclear Restore:** Added options to either restore a single save slot (Safe) or the entire profile directory including `profile.sii` (Nuclear).
- **Consitency & UX:** Success notifications for restore actions now use the same Emerald toast style as the Dashboard. Navigation is now seamless with background data refreshing, eliminating the need for full page reloads.
- **Full i18n Support:** Added comprehensive Indonesian and English translations for all restore-related interfaces and messages.

### Fixed
- **HTML Nesting Error:** Fixed a hydration warning where a button was nested within another button in the Profile List.
- **Backend Stability:** Fixed a critical server-side crash caused by missing variable initializations in the profile routes.

## [1.1.3-alpha.2] - 2026-03-17

### Added
- **Job Editor / Management:** New dedicated view for active cargo. Easily reset delivery deadlines to gain maximum time or fix cargo damage completely to 0% to prevent delivery penalties.
- **Job Editor Consistency:** Aligned the header positioning for all internal sub-menus (Job, Profile, Driver, User) with the sidebar layout to fix overlapping visual bugs on desktop views.

## [1.1.3-alpha.1] - 2026-03-16

### Added
- **Economy Reset:** Added a new "Economy Reset" quick action button to the Dashboard. Instantly refreshes the in-game Freight Market job list by advancing internal game time, fixing "no jobs available" issues commonly caused by mod changes.
- **Custom License Plates:** Added a custom license plate text input for player-owned trucks within the Truck Editor. Supports up to 8 characters and automatically preserves the truck's registered country formatting.

### Fixed
- **Custom License Plate Persistence:** Fixed an issue where the parser wouldn't save custom plate changes unless accompanied by a truck repair/refuel action.

## [1.1.2] - 2026-03-15

### Added
- **Save Confirmation Modal:** Pressing Save now shows a confirmation modal listing all changes made before writing to the save file. Prevents accidental overwrites.
- **Change Log Tracking:** Every modification (money, XP, skills, trucks, garages, trailers, map, loans) is automatically recorded as a labeled change entry with icon and color.
- **Undo History:** Up to 20 levels of undo. An undo button (circular, with a level counter badge) appears above the Save button when changes are pending. Also triggered via `Ctrl+Z`.
- **Save Success Notification:** A toast notification appears after a successful save confirming the operation.
- **Keyboard Shortcut — Undo:** `Ctrl+Z` to undo the last action.
- **Keyboard Shortcut — Save:** `Ctrl+S` now opens the confirmation modal instead of saving directly.
- **Unified Floating Action Group:** Undo and Save buttons are grouped together in the bottom-right corner, consistent across all views.

### Changed
- **Save Flow:** Save is now a two-step process — trigger → confirm → save. The confirmation modal shows a full list of pending changes.
- **Removed Duplicate FABs:** Per-view floating Save buttons removed from `ProfileEditor`, `UserEditor`, and `DriverEditor`. One global Save button now serves all views.
- **Undo Button Shape:** Circular button (w-12) aligned center with the Save button (w-16) for visual consistency.

### Promoted from
- `1.1.2-alpha.1` — GitHub Issues reporter, app version in bug form, donation links
- `1.1.2-alpha.2` — Trailer Editor, Map Discovery Editor, extended i18n
- `1.1.2-beta.1`  — Build stability verification, broader testing

## [1.1.2-beta.1] - 2026-03-07

### Added
- Promoted to beta release for broader testing.
- Verified build stability and component compatibility.

## [1.1.2-alpha.2] - 2026-03-05

### Added
- **Trailer Editor:** A dedicated fleet manager for player-owned trailers. Allows repairing cargo damage and trailer body wear to 0%.
- **Map Discovery Editor:** New dashboard tab to view discovery statistics. Includes a "Unlock Visited Cities" feature that marks all registered cities on the map as 100% discovered.
- **Extended i18n Support:** Added comprehensive Indonesian and English translations for the new Trailer and Map features.

### Changed
- **Save Game Parser:** Enhanced the `.sii` parser to handle trailer blocks (`trailer` type) and player discovery arrays (`visited_cities`).
- **Dashboard Sidebar/Nav:** Added Map and Trailer icons to the desktop sidebar and mobile bottom navigation bar.

## [1.1.2-alpha.1] - 2026-03-04

### Added
- **GitHub Issues Bug Reporter:** SupportModal now has two reporting options — "Open GitHub Issue" (opens a pre-filled GitHub Issue with bug details, app version, and game version) and "Send via Email" (existing backend route). GitHub Issues are public and traceable; Email is private and direct.
- **Auto-detected App Version in Bug Report:** The bug report form now automatically displays the current app version (from `NEXT_PUBLIC_APP_VERSION`) as a read-only badge. Both app version and game version are included in all bug reports sent via email or GitHub Issues.
- **Donation Links in README:** Added `## ❤️ Support the Project` section with Trakteer and Saweria badge links to both `README.md` (EN) and `README-ID.md` (ID).

## [1.1.1] - 2026-03-04


### Added
- **Custom App Icon:** Desktop app now uses custom WebP brand icon instead of the default Electron icon. Icon is displayed in the taskbar, title bar, and bundled inside the `.AppImage` / Windows installer.

### Fixed
- **Garage Small Slot Count:** Fixed a critical bug where unlocking a garage to "Small" only allocated **1 slot** for vehicles and drivers, instead of the correct **3 slots** that the game (ETS2/ATS) expects. Saves that only unlocked a garage without upgrading it further would not be recognized correctly in-game.
- **Removed Invalid Medium Garage State:** Removed the "Upgrade to Medium" option from the Garage Editor modal. In ETS2/ATS, there is no medium garage — the upgrade path is: **Locked → Small → Large**. Garages previously set to medium (status=2) are now correctly displayed as Small in the UI.

## [1.1.0-beta.4] - 2026-03-04


### Fixed
- **CI/CD Release Assets:** Fixed GitHub Actions workflow where build artifacts (`.AppImage`, `.exe`) were never uploaded to Release assets. Root cause: missing `outputs` block on the `release` job caused the `build-desktop` job to be silently skipped.
- **Workflow Stability:** Added `fail-fast: false` to matrix strategy and `fail_on_unmatched_files: false` to prevent cross-platform file mismatch failures (Linux doesn't produce `.exe`, Windows doesn't produce `.AppImage`).

### Added
- **CI Debug Steps:** Added debug steps in the build workflow to log release job outputs and list build artifacts before upload, making future CI issues easier to diagnose.

## [1.1.0-beta.1] - 2026-03-03

### Changed
- **Repository Structure:** Separated the backend API into a private repository. This repository now exclusively hosts the Frontend (Next.js) and Electron Desktop App source code.
- **Documentation:** Updated README and architecture documentation to reflect the newly separated frontend-backend architecture.

## [1.0.1] - 2026-03-02

### Added
- **Garage Inspection Modal:** Refactored the Garage Editor to include an interactive popup modal. Click on any city garage to view specific driver counts, vehicle capacity, and a detailed list of all trucks assigned to that specific garage (including their odometer and license plate).
- **Stagger Animations:** Added smooth fluid wave animations to mass-action garage buttons ("Unlock All" and "Upgrade Owned") and entrance lists.
- **About Page:** Introduced a new "About This Project" menu with build version checking, developer repository links, and donation options (Trakteer & Saweria).
- **WebP App Icon:** Implemented a new custom favicon logo format via `layout.tsx` metadata routing.
- **MIT License:** Distributed the open-source license officially to the repository.

### Changed
- **SEO & Metadata:** Updated the global site title to "Truckers Tool Linux -- for ALL".
- **i18n Dictionaries:** Expanded translation dictionaries (`en.ts` / `id.ts`) to comprehensively cover newly added About tools, donation labels, and Garage slot properties.

### Fixed
- **State Hydration:** Resolved a bug in parser logic where upgrading a garage with existing vehicles or drivers would unintentionally delete them. The parser now safely preserves and re-attaches existing garage components.

## [1.0.1-beta.1.4] - 2026-03-02

### Added
- **Separated Garages & Trucks Tabs:** Split the combined "Garages & Trucks" menu into two distinct Dashboard tabs with dedicated navigation icons (desktop sidebar & mobile bottom nav).
- **Truck Fleet Manager:** Brand-new `TruckEditor` component displaying a complete fleet overview — brand icons with country flags, model names, license plates, odometer readings, fuel levels, and overall condition ratings.
- **Expandable Truck Detail:** Click any truck card to reveal a detailed breakdown panel with individual fuel bar, per-component wear bars (Engine, Transmission, Cabin, Chassis, Wheels), and per-truck Repair & Refuel action buttons.
- **Per-Truck Repair & Refuel:** Individual trucks can now be repaired or refueled separately, in addition to global "Repair All" and "Refuel All" actions.
- **Enhanced Garage Cards:** Garage cards now show vehicle/driver slot counts, trailer counts, and status badges (Small, Medium, Large) with filter tabs (All, Owned, Locked) and a summary stats bar.

### Changed
- **High-Performance Parser:** Completely rewrote `parser.ts` from regex block-matching to single-pass line scanning. Regex `[\s\S]*?` patterns caused catastrophic backtracking on large (5MB+) `.sii` files; new parser processes 218K lines instantly.
- **Full-Width Editor Layout:** Garage and Truck views now use consistent full-width layout (`max-w-7xl`) matching ProfileEditor and UserEditor, instead of the previous narrow `max-w-md` constraint.
- **Responsive Grids:** Garage grid scaled to 2–5 responsive columns; truck list uses 1–2 column grid on wider screens.

### Fixed
- **License Plate Markup Bug:** Fixed plates displaying raw SCS markup tags (`<offset>`, `<img>`, `<color>`, `<font>`, `<align>`, etc.). Plates are now cleanly stripped to plain text (e.g., `FSM689`, `1-LSQ-445`).
- **Truck Detection Failure:** Trucks were not being detected due to the old regex parser hanging on large files. The new line-scanning parser correctly identifies all player-owned vehicles.

## [1.0.1-beta.1.3] - 2026-03-01

### Added
- **Garage Editor:** Added instant action cards ("Unlock All Garages" & "Upgrade Owned") to gracefully apply _Large_ garage pad templates directly into `game.sii` via RegEx, expanding up to 180+ map garages instantly.
- **Support / Feedback Module:** Introduced new Support Modal `SupportModal` on Dashboard & Welcome Screen allowing users to send feedback with automated `nodemailer` SMTP system integration.
- **Multilingual Support (i18n):** Added full English (`en`) and Indonesian (`id`) language support across the entire interface (Dashboard, Editor, Tooltips, Welcome Screen).
- **Language Switcher:** A new sleek toggle button featuring 🇺🇸 / 🇮🇩 flag icons on the `WelcomeScreen`.
- **Translated Documentation:** Transitioned the main `README.md` to English and preserved the Indonesian manual in `README-ID.md`.
- **Translated Installer Script:** `ttl.sh` terminal outputs are now completely translated to English.

### Fixed
- **SSR Prerender Hydration Mismatch:** Resolved Next.js Server-Side Rendering build bugs by wrapping components appropriately with the upgraded internal `LanguageProvider`.

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

