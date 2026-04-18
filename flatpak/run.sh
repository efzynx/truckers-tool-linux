#!/bin/bash
# This wrapper uses zypak-wrapper, a specific Flatpak system to avoid conflicts 
# between Electron's built-in Chromium sandbox and the Flatpak sandbox.
exec zypak-wrapper /app/main/truckers-tool-linux "$@"
