# Meta VR tooling setup inspection

Date: 2026-10-15. Application code was not changed.

## Installed tools

| Tool | Result |
| --- | --- |
| Codex CLI | 0.162.0-alpha.17.2 |
| Node.js | v22.14.0 |
| npm | 10.9.2 |
| Unity Editor | 6000.5.6f1, build 0e0577a1a2ac; matches project |
| Unity Hub | Not found at the two standard Program Files/user Programs locations checked; other locations unverified |
| Meta VR CLI | Not on PATH; default `%USERPROFILE%\.metavr\bin\metavr.exe` absent |

## Stop point

Nothing was installed. The official native Windows installer writes to the user `.metavr` directory and updates user PATH, outside this chat's permitted write roots. The user explicitly requested stopping when approval/manual action is needed.

Run this official command manually in PowerShell:

```powershell
iwr -useb https://developers.meta.com/horizon/install-cli/windows/ | iex
```

Reopen the terminal afterward. The next verification commands are:

```powershell
metavr --version
metavr doctor
```

After CLI verification succeeds, the remaining official setup commands are:

```powershell
codex plugin marketplace add meta-quest/agentic-tools
codex plugin add meta-vr
metavr mcp install codex
```

Local Codex help confirms `plugin add` and `plugin marketplace add` are supported. Plugin installation and MCP configuration have not been performed or verified. No Meta MCP tools are exposed to this session. Reload/restart Codex after installation, then verify skill and MCP discovery in the new session.

## Requested skills

All nine exact names are listed in the official Meta repository. They are not available in this session; local installation remains unverified:

- hz-quest-verify-first
- hz-immersive-designer
- hz-unity-meta-core-sdk
- hz-unity-device-readiness
- hz-unity-code-review
- hz-xr-simulator-install-and-configure
- hz-xr-simulator-control
- hz-vr-debug
- hz-perfetto-debug

The current `hz-unity-device-readiness` description concerns Meta VR Glasses input/field-of-view readiness; it should not be assumed to be a complete Quest 3 readiness check.

## Simulator and device

XR Simulator was not installed or configured. Its installation/control skills exist upstream; local simulator availability was not verified. Later simulator setup should use the official installation skill to check prerequisites and configure the existing Unity project, with separate authorization. A physical headset is not needed for this CLI/plugin setup. Device debugging approval and Developer Mode can wait until device work.

## Warnings and readiness

- Codex version/help commands succeeded but emitted access-denied warnings for cleaning/creating `.codex\tmp\arg0` files and PATH aliases.
- `metavr --version` and `metavr doctor` cannot run until installation.
- Meta skills and MCP remain unverified; the complete toolchain is not ready yet.
- Existing Unity licensing/compiler IPC limitations remain unresolved by this inspection.
- No Group 2 implementation, simulator configuration, or product behavior changes were made.

Sources: [Meta CLI installation](https://developers.meta.com/vr/essentials/metavr-install/), [Meta agentic tools and skill catalog](https://github.com/meta-quest/agentic-tools).
