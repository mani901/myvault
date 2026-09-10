<div align="center">

# MyVault

**A local-first, offline password manager and encrypted secrets vault for your desktop.**

No cloud. No account. No telemetry. Your data never leaves your device.

Windows · macOS · Linux — built with [Tauri](https://tauri.app), [Rust](https://www.rust-lang.org) & [React](https://react.dev)

![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-6d5bf6)
![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%202-24c8db)
![Encryption](https://img.shields.io/badge/crypto-AES--256--GCM%20%2B%20Argon2id-1b1834)
![License: MIT](https://img.shields.io/badge/license-MIT-green)

</div>

---

## What is MyVault?

**MyVault** is a free, open-source **password manager** and **secrets manager** that runs entirely on
your own computer. It's a **privacy-first, offline alternative to cloud password managers** like
Bitwarden, 1Password, or LastPass — everything is stored in a single **encrypted vault file** on
your local disk, unlocked with one master password that is never transmitted or saved anywhere.

Use it to keep **passwords**, **API keys**, **secure notes**, **bookmarks**, and any other sensitive
key/value data organised, searchable, and safe.

> Your data is encrypted locally on this device with **AES-256-GCM**, and your master password is
> stretched with **Argon2id**. If you lose the master password, the data cannot be recovered — by
> design.

---

## Features

- 🔐 **Passwords** — title, username, email, password, URL, and notes, with a one-click strong
  password generator.
- 🔑 **API keys** — service name, key, optional secret, and environment (e.g. `production`).
- 📝 **Secure notes** — free-form encrypted text.
- 🔖 **Bookmarks** — URLs with tags.
- 🗂️ **Other** — flexible name/value fields for licence keys, recovery codes, PINs, anything.
- 🧭 **Sidebar navigation** with live per-category counts.
- 🔎 **Instant search** across titles, usernames, emails, URLs, services, and tags.
- 🎲 **CSPRNG password generator** — adjustable length, character sets, and "exclude ambiguous
  characters", generated in Rust (never `Math.random`).
- 📋 **Copy with auto-clear** — sensitive values are wiped from the clipboard after ~20 seconds,
  and a fresh copy never clobbers a newer one.
- ⏱️ **Auto-lock on inactivity** — configurable timeout; locking zeroizes the encryption key in
  memory.
- ⚡ **Quick unlock** (opt-in) — unlock via the OS keychain (Windows Credential Manager / macOS
  Keychain / Linux Secret Service) instead of typing the master password. Off by default.
- 💾 **Backup & restore** — export the whole encrypted vault to any folder, restore it on any
  machine.
- 🌗 **Light & dark themes** — manual toggle, remembered between launches.
- 🖥️ **Cross-platform desktop app** — a single native binary, ~5–10 MB installed.

---

## Why local-first?

| | Cloud password managers | **MyVault** |
|---|---|---|
| Where your data lives | Someone else's servers | **Your disk only** |
| Account required | Yes | **No** |
| Works fully offline | Partially | **Always** |
| Network requests | Constant | **None** (CSP blocks all remote origins) |
| Backup control | Vendor-managed | **You own the file** |
| Attack surface | Vendor breach, phishing portal, sync bugs | **Your device** |

MyVault is for people who want a password vault they fully control and can reason about — not a
subscription.

---

## Security model

MyVault uses **envelope encryption**, the same pattern as Bitwarden and 1Password:

1. On first run, a random 256-bit **Data Encryption Key (DEK)** is generated with the OS CSPRNG.
2. Your master password is run through **Argon2id** (64 MiB memory, 3 iterations) with a random
   salt to derive a **Key-Encryption-Key (KEK)**.
3. The DEK is encrypted ("wrapped") with the KEK using **AES-256-GCM** and stored. The master
   password itself is **never stored** — a wrong password simply fails to unwrap the DEK, which
   doubles as the password verifier.
4. Every vault item is serialized and encrypted as its own **AES-256-GCM** blob under the DEK,
   with a unique nonce. Item titles, URLs, and notes are **never written to disk in plaintext**.
5. While unlocked, the DEK lives only in memory, wrapped in a `Zeroizing` buffer that is wiped on
   lock, on idle timeout, and on exit.
6. **Changing the master password** re-wraps the existing DEK — it never re-encrypts your items.

Additional hardening:

- **Content Security Policy** locks the web layer to `'self'` — no remote scripts, styles, fonts,
  images, or network calls are possible.
- Fonts are **self-hosted and bundled**; the app makes zero network requests at runtime.
- Native OS file dialogs are used for backup/restore; the actual file I/O runs in Rust, not
  through a broadly-scoped filesystem permission.

The vault database lives at:

| OS | Path |
|---|---|
| Windows | `%APPDATA%\com.myvault.app\vault.db` |
| macOS | `~/Library/Application Support/com.myvault.app/vault.db` |
| Linux | `~/.local/share/com.myvault.app/vault.db` |

---

## Install

### Download a release

Grab the latest installer from the [**Releases**](../../releases) page:

| Platform | File |
|---|---|
| Windows | `myvault_<version>_x64-setup.exe` (recommended) or `.msi` |
| macOS | `myvault_<version>_universal.dmg` |
| Linux | `.AppImage`, `.deb`, or `.rpm` |

> **Windows SmartScreen:** the installer isn't code-signed, so Windows may show
> *"Windows protected your PC"*. Click **More info → Run anyway**. This is expected for an
> unsigned independent app.

The installed app is fully standalone — no Node, Rust, or dev server required.

### Build from source

**Prerequisites:** [Node.js](https://nodejs.org) 20+, [Rust](https://rustup.rs) (stable), and the
[Tauri OS prerequisites](https://tauri.app/start/prerequisites/) for your platform.

```bash
git clone https://github.com/mani901/myvault.git
cd myvault
npm install
npm run tauri build
```

Installers are written to `src-tauri/target/release/bundle/`.

---

## Development

```bash
npm install
npm run tauri dev      # launch the app with hot reload
```

Other scripts:

```bash
npm run lint                              # ESLint
npx tsc -b                                # type-check
cargo test --manifest-path src-tauri/Cargo.toml   # Rust unit tests
```

The Rust crypto, database, and command layers are covered by unit tests (round-trip encryption,
wrong-password rejection, migration idempotency, item CRUD, backup export/import).

---

## Tech stack

| Layer | Tech |
|---|---|
| Shell | [Tauri 2](https://tauri.app) (Rust) |
| Backend | Rust — `rusqlite` (bundled SQLite), `aes-gcm`, `argon2`, `keyring`, `zeroize` |
| Storage | SQLite, encrypted at rest (per-item AES-256-GCM blobs) |
| Frontend | React 19 + TypeScript + Vite |
| State | Zustand |
| Styling | Tailwind CSS v4, self-hosted Plus Jakarta Sans |
| Icons | Lucide |

---

## Project structure

```
myvault/
├── src/                         # React frontend
│   ├── components/
│   │   ├── Layout/              # TopBar, Sidebar, AppShell, BackgroundDecor
│   │   ├── Items/               # list, detail panel, form + per-kind field editors
│   │   ├── PasswordGenerator/
│   │   ├── Settings/            # settings panel + backup/restore section
│   │   ├── Unlock/              # setup & unlock screens
│   │   └── common/              # Modal, CopyButton, FormField
│   ├── stores/                  # Zustand stores (vault, settings, theme)
│   ├── lib/                     # IPC wrappers, clipboard, idle timer
│   └── types/
└── src-tauri/                   # Rust backend
    ├── src/
    │   ├── crypto.rs            # Argon2id KDF + AES-256-GCM helpers
    │   ├── db.rs                # SQLite connection, migrations, row access
    │   ├── state.rs             # in-memory key (Zeroizing) + app state
    │   ├── models.rs            # ItemPayload enum, DTOs
    │   └── commands/            # vault, items, generator, settings, backup, system
    └── migrations/
```

---

## Backup & restore

**Settings → Backup & restore.**

- **Export** copies the live, still-encrypted vault database to any file you choose, using
  SQLite's Online Backup API so the snapshot is consistent even while the app is running. The
  backup is exactly as safe as the original — it's the same encrypted file.
- **Restore** replaces the current vault from a chosen `.db` file, after validating it's a real
  MyVault database and asking you to confirm. Because a restored file may have a different master
  password, the app returns to the unlock screen afterward.

Keep a backup somewhere safe — losing both your vault file **and** your master password means the
data is unrecoverable.

---

## Roadmap

- [ ] Code-signed release builds (Windows & macOS)
- [ ] Optional import from browser / CSV / other password managers
- [ ] Password strength meter and breach-age hints (fully offline)
- [ ] User-defined tags and folders
- [ ] TOTP / 2FA code storage

---

## Contributing

Issues and pull requests are welcome. Please run `npm run lint`, `npx tsc -b`, and the Rust tests
before opening a PR.

## License

Released under the [MIT License](LICENSE).

---

<div align="center">
<sub>MyVault — an open-source, offline, privacy-first password manager and encrypted secrets vault.</sub>
</div>
