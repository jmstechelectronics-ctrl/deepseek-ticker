#!/bin/bash
# DeepSeek Credit Ticker — Install Script
# Run this to install the extension and configure your API key.

set -euo pipefail

EXT_UUID="together-ticker@josh"
EXT_DIR="${HOME}/.local/share/gnome-shell/extensions/${EXT_UUID}"
CONFIG_DIR="${HOME}/.config/deepseek-ticker"
KEY_FILE="${CONFIG_DIR}/key"

# --- Step 1: Copy extension files ---
echo "📁 Installing extension to ${EXT_DIR}..."
mkdir -p "${EXT_DIR}"
cp together-ticker@josh/* "${EXT_DIR}/"
echo "   ✓ Files copied"

# --- Step 2: Set up API key ---
echo ""
echo "🔑 Configuring DeepSeek API key..."

mkdir -p "${CONFIG_DIR}"

if [ -f "${KEY_FILE}" ] && [ -s "${KEY_FILE}" ]; then
    CURRENT_KEY=$(cat "${KEY_FILE}")
    echo "   Existing key found (${#CURRENT_KEY} chars). Leaving as-is."
else
    # Check if DEEPSEEK_API_KEY is set in environment
    if [ -n "${DEEPSEEK_API_KEY:-}" ]; then
        echo "${DEEPSEEK_API_KEY}" > "${KEY_FILE}"
        echo "   ✓ Key imported from \$DEEPSEEK_API_KEY"
    else
        read -rsp "   Paste your DeepSeek API key (input hidden): " USER_KEY
        echo ""
        if [ -n "${USER_KEY}" ]; then
            echo "${USER_KEY}" > "${KEY_FILE}"
            echo "   ✓ Key saved"
        else
            echo "   ⚠ No key provided — edit ${KEY_FILE} later"
        fi
    fi
fi

chmod 600 "${KEY_FILE}"

# --- Step 3: Enable the extension ---
echo ""
echo "🔌 Enabling extension..."

if command -v gnome-extensions &>/dev/null; then
    gnome-extensions enable "${EXT_UUID}" 2>/dev/null || {
        gnome-extensions install "${EXT_DIR}" 2>/dev/null || true
        gnome-extensions enable "${EXT_UUID}" 2>/dev/null || true
    }
    echo "   ✓ Extension enabled via gnome-extensions"
elif command -v gnome-shell-extension-tool &>/dev/null; then
    gnome-shell-extension-tool --enable "${EXT_UUID}"
    echo "   ✓ Extension enabled via gnome-shell-extension-tool"
else
    echo "   ⚠ Could not auto-enable. Enable manually:"
    echo "     gnome-extensions enable ${EXT_UUID}"
fi

# --- Step 4: Restart shell guidance ---
echo ""
echo "🔄 Restart GNOME Shell to load the extension:"
echo "   killall -HUP gnome-shell"
echo "   (or Alt+F2, type 'r', press Enter)"
echo ""
echo "✅ Done! You'll see 'DS: ...' appear in your top bar,"
echo "   refreshing every 10 seconds."
echo ""
echo "📁 Extension files: ${EXT_DIR}"
echo "🔑 API key:        ${KEY_FILE}"
echo ""
echo "To remove:  gnome-extensions disable ${EXT_UUID}"
echo "            rm -rf ${EXT_DIR}"
echo "            rm -rf ${CONFIG_DIR}   # removes key too"
