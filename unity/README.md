# Adaptive Spatial Labs — Unity Group 1, Task 1

Unity 6000.5.6f1 is selected with the user's approval. This project is a world-space Unity/Meta Quest foundation, not a web client. It contains central design tokens, reusable component implementations, a deterministic prefab/scene builder, all 15 Group 1 placeholder routes, separate public/authenticated shells, networking/DTO/session/state foundations, and tests. No full business flow is wired.

Open this folder (`unity`) through Unity Hub using the installed editor. Once Unity has compiled:

1. Choose **Adaptive Spatial Labs → Build Task 1 Foundation**. This creates the 21 component prefabs, two shell prefabs, 15 placeholder view prefabs, theme/registry/API assets, application scene, and Quest configuration.
2. Open `Assets/AdaptiveSpatialLabs/Scenes/Group1Foundation.unity` and enter Play mode.
3. Sidebar items, New Project, and avatar are navigation only. Avatar opens Profile directly; Settings opens Settings. No dropdown is attached to the avatar.
4. Use **Adaptive Spatial Labs → Task 1 Route Preview**, assign the scene's ApplicationComposition object, and select public/wizard routes. This is an Editor tool, not a product screen or a fake sign-in.
5. Use **Adaptive Spatial Labs → Build Component Showcase** to create a separate verification scene for the library. It is not a product route.
6. Run EditMode tests through Unity Test Runner. Add Android Build Support/SDK/NDK/OpenJDK for this editor before APK/device testing.

From a normal PowerShell terminal:

```powershell
cd C:\Users\Khushboo\Documents\Codex\2026-10-06\ju
.\unity\Tools\verify-unity.ps1
```

Core-only verification (shared NUnit test source, Unity's bundled Roslyn and Newtonsoft.Json, no Unity IPC):

```powershell
.\unity\Tools\verify-core.ps1
```

The core-only runner does not verify Unity scene compilation, native UI rendering, XR interaction, or device behavior. The full handoff and the exact verification status are in `../outputs/group1-frontend-task1-report.md`.

References remain in `../outputs/Screens_group1`. `Brand/ReferenceBrand.png` is an unchanged copy of Homepage.png; the builder defines a sprite rectangle for its existing logo, without synthesizing new branding. Existing reference screens are not flattened into UI backgrounds.

The default configuration uses loopback HTTP for development only. A physical Quest must use a reachable machine address or HTTPS endpoint; loopback on the headset is the headset itself. Token storage defaults to memory, never plaintext PlayerPrefs. Session restoration and automatic refresh belong to a subsequent frontend task.
