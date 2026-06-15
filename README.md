# DeepSeek Credit Ticker — GNOME Shell Extension

Live DeepSeek API credit balance in your GNOME top bar, updated every 10 seconds.

Shows `DS: $5.88` — click the label to refresh immediately. Green text when healthy, grey while loading, red if no API key is found.

## Install

```bash
# Clone the repo
git clone https://github.com/jmstech/deepseek-ticker.git
cd deepseek-ticker

# Run the install script
bash install.sh
```

Then restart GNOME Shell:
- `Alt+F2` → `r` → `Enter`, **or**
- `killall -HUP gnome-shell`

You'll see `DS: ...` in the top bar updating to your balance within seconds.

## Manual Install

```bash
# Copy the extension files
mkdir -p ~/.local/share/gnome-shell/extensions/together-ticker@josh
cp together-ticker@josh/* ~/.local/share/gnome-shell/extensions/together-ticker@josh/

# Set up your DeepSeek API key
mkdir -p ~/.config/deepseek-ticker
echo "sk-xxx...xxxx" > ~/.config/deepseek-ticker/key
chmod 600 ~/.config/deepseek-ticker/key

# Enable the extension
gnome-extensions enable together-ticker@josh

# Restart shell
killall -HUP gnome-shell
```

## API Key

The extension reads your DeepSeek API key from:

```
~/.config/deepseek-ticker/key
```

Get your API key from [platform.deepseek.com/api-keys](https://platform.deepseek.com/api-keys).

## How It Works

Every 10 seconds, the extension calls `GET https://api.deepseek.com/user/balance` with your API key and displays `DS: $X.XX` in the top panel.

- **Soup 3.0** — single persistent session, no overhead per poll
- **Text caching** — the label only re-renders when the dollar amount actually changes (zero flicker)
- **Silent errors** — if the API fails, the last known balance stays visible

## Requirements

- GNOME Shell 42–47
- Soup 3.0 (comes with GNOME)
- A DeepSeek API key

## Files

```
deepseek-ticker/
├── together-ticker@josh/
│   ├── extension.js      — Main extension (ES modules, Soup 3.0)
│   ├── metadata.json     — Extension manifest (GNOME 42–47)
│   └── stylesheet.css    — Label styling
├── install.sh            — One-command install and key setup
├── LICENSE               — MIT
└── README.md             — This file
```

## Troubleshooting

| Display | Meaning |
|---|---|
| `DS: ...` | Loading / no data yet |
| `DS: $X.XX` | Current balance |
| `DS: ?` | No API key found at `~/.config/deepseek-ticker/key` |
| `DS: ERR` (legacy) | Network error or invalid key (keeps last good value instead) |

Check GNOME Shell logs:
```bash
journalctl -f -o cat /usr/bin/gnome-shell | grep 'DS Ticker'
```

## Remove

```bash
gnome-extensions disable together-ticker@josh
rm -rf ~/.local/share/gnome-shell/extensions/together-ticker@josh
rm -rf ~/.config/deepseek-ticker   # optional — removes your key too
```

## License

MIT
