# Adaptive Spatial Labs — Group 1 Frontend, Task 1

Project: `C:\Users\Khushboo\Documents\Codex\2026-10-06\ju\unity`.

**Status: source foundation implemented; Task 1 is not yet fully verified.** The shared C# code compiled and passed 47 tests. Unity resolved the XR/UI packages, but Editor runs could not connect to the licensing client and IL Post Processor inside this environment. Consequently, native prefab/scene generation, full Unity compilation, rendering, and UI interaction checks remain pending. No Task 2 or Group 2 implementation was started. The existing backend was preserved.

The user explicitly approved the installed **6000.5.6f1 Update editor** for this foundation in place of an installed LTS. Android Build Support is absent from that editor installation. No replacement editor or Android module was installed.

## 1. Unity folder tree

The complete current source-file listing is in `group1-frontend-source-tree.txt`. Unity-generated `.meta` files and local Library/Temp/Logs are excluded from that listing.

```text
unity/
  Assets/AdaptiveSpatialLabs/
    App/
      ASL.App.asmdef
      AppCompositionRoot.cs
      MrPanelPlacement.cs
    Brand/
      ReferenceBrand.png
    Core/
      ASL.Core.asmdef
      Auth/                 ITokenStore, IAccessTokenProvider, SessionState
      Configuration/        ApiClientOptions, ApiConfiguration
      Navigation/           ScreenRoute, RouteDefinition, Group1Routes,
                            NavigationState, NavigationService
      Networking/           IApiClient, IHttpTransport, HttpRequest,
                            HttpResponse, ApiException, JsonCodec
      State/                ProjectListState, ProjectCreationDraft,
                            ProjectCreationDraftState
    Models/
      ASL.Models.asmdef
      Api/                  Account, auth, token, organization, project,
                            editor, structure, layer, source, preference,
                            success-envelope and error DTOs
      link.xml
    Services/
      ASL.Services.asmdef
      Api/                  ApiClient, UnityWebRequestTransport
      Session/              SessionService
      Storage/              InMemoryTokenStore
    UI/
      ASL.UI.asmdef
      DesignSystem/
        DesignTheme.cs
        Colors/             ColorTokens
        Typography/         TypographyTokens, TextStyle, ThemedText
        Spacing/            SpacingTokens
        Dimensions/         MrDimensions
        Icons/              LineIcon, IconKind
        States/             ControlState
      Components/
        Buttons/            ActionButton, PrimaryButton, SecondaryButton, IconButton
        Inputs/             TextInput, PasswordInput, SearchInput, PasswordVisibilityToggle
        Dropdowns/          DropdownInput
        Cards/              StandardCard, ProjectCard
        Sidebar/            SidebarNavItem, Sidebar
        TopBar/             TopBar
        Tabs/               TabControl
        Stepper/            StepIndicator, Stepper
        Avatar/             Avatar
        Headers/            SectionHeader
        Badges/             StatusBadge
        Panels/             RoundedPanel
        States/             MessageState
        Loading/            LoadingState
        Errors/             ErrorState
        EmptyStates/        EmptyState
      Shells/               PublicShell, AuthenticatedShell
      Screens/              ScreenView, ScreenRegistry, ScreenPresenter
    Features/
      README.md             Subsequent Group 1 feature boundaries; no workflows
    Editor/
      ASL.Editor.asmdef
      FoundationPaths.cs
      FoundationBuilder.cs
      ThemeAssetBuilder.cs
      ComponentLibraryBuilder.cs
      QuestProjectSetup.cs
      XrRigFactory.cs
      FoundationPreviewWindow.cs
      ShowcaseBuilder.cs
      UI/                   Primitive, button, input, card, composite,
                            shell, and placeholder-view builders
    Tests/EditMode/
      ASL.Tests.asmdef
      RouterTests.cs
      DraftStateTests.cs
      DtoContractTests.cs
      SessionStateTests.cs
      ApiClientTests.cs
      UiFoundationTests.cs
  Packages/
    manifest.json
    packages-lock.json
  ProjectSettings/
    ProjectVersion.txt
    ProjectSettings.asset
    ... generated Unity settings
  Tools/
    verify-core.ps1
    verify-syntax.ps1
    verify-unity.ps1
    CoreVerification/
    SyntaxVerification/
  README.md
  .gitignore
```

The source assemblies have explicit boundaries: Models → Core → Services/UI → App → Editor/Tests. UI does not reference Services, networking implementations, or feature workflows. AppCompositionRoot creates instance-scoped services and wires navigation events; it is not a singleton or an all-domain state store. A static dependency/reference audit passed against the actual resolved package definitions and plugin DLL names.

### Assets produced by the supplied Editor builder

These are **generation targets, not assets claimed to have been generated successfully**:

- `Configuration/Group1Theme.asset`, `DevelopmentApi.asset`, `Group1Screens.asset`, XR settings, and controller-ray material.
- `UI/Prefabs/Components/`: 21 component prefabs including separate StepIndicator and Stepper.
- `UI/Prefabs/Shells/PublicShell.prefab` and `AuthenticatedShell.prefab`.
- `UI/Screens/{Landing,Auth,Home,Meetings,MySpace,Inbox,Profile,Settings,ProjectCreation}/`: the 15 placeholder prefabs.
- `Scenes/Group1Foundation.unity`: application scene, XR origin, world-space UI, registry, and composition root.
- `Scenes/ComponentShowcase.unity`: optional component verification scene; no product route is added.

## 2. Packages and configuration

Unity's package manager downloaded/resolved these pinned packages and wrote the lockfile:

| Package | Version |
| --- | --- |
| OpenXR plug-in | 1.18.0 |
| Unity OpenXR Meta | 2.6.1 |
| XR Interaction Toolkit | 3.6.1 |
| XR Plug-in Management | 4.7.0 |
| Input System | 1.20.1 |
| AR Foundation | 6.6.2 |
| uGUI / TextMeshPro | 2.0.0 |
| Unity Newtonsoft.Json package | 3.2.2 |
| Unity Test Framework | 1.4.6 |

Required built-in Unity modules and transitive XR dependencies are in the manifest/lockfile. No preview/experimental package version was selected. JSON is a precompiled `Newtonsoft.Json.dll` reference, not an invented Unity assembly-definition name. DTO reflection is preserved through `Models/link.xml` for later IL2CPP use.

PlayerSettings now contain the product/company name, Android identifier `com.adaptivespatiallabs.quest`, minimum Android API 32, ARM64, IL2CPP, Linear color space, and the new Input System selection. These serialized baseline settings were updated; they were not tested in an Android build.

## 3. Quest/OpenXR setup

The `QuestProjectSetup` Editor command prepares:

- Android OpenXR loader and auto-start; standalone loader configuration with automatic startup off for desktop preview.
- Oculus Touch controller profile, Meta Quest support feature, and Meta AR Camera/Passthrough feature.
- Single-pass instanced rendering, Vulkan, ARM64/IL2CPP, API 32 minimum, and development-only HTTP.

`XrRigFactory` prepares an XR Origin, tracked HMD camera, left/right ray controllers, trigger UI press actions, ray visuals, AR Session/Camera Manager/Camera Background, and an XR UI Input Module. The application canvas uses a Tracked Device Graphic Raycaster. Widgets emit ordinary callbacks so later hand input can share the same UI contract.

**The native XR settings assets and rig/scene have not been generated or executed here.** The configuration command must finish in a working Unity Editor. It can generate the desktop preview without Android Build Support; installing that module and re-running Configure Quest OpenXR is required to assign the Android loader/features. Android SDK/NDK/OpenJDK must be available before APK verification. No passthrough, controller, hand, or tracking behavior has been validated on hardware.

## 4. Design tokens

All 15 supplied images were inspected. The authenticated navy/blue styling and the explicit task instructions guide the shared library. Placeholder bodies remain empty; no complete reference page has been reconstructed yet.

| Color token | Value |
| --- | --- |
| App background | #081522 |
| Panel | #0D1B29 |
| Secondary panel | #152535 |
| Border | #35516B |
| Primary blue / hover | #0084FF / #289AFF |
| Primary / secondary / muted text | #F4F7FC / #A8C2DE / #819BB3 |
| Success / warning / error | #2AC49B / #E5B45B / #F27982 |
| Private state | #7C91B6 |
| Selected navigation / disabled | #123D72 / #253649 |

Typography uses one TextMeshPro font supplied by its essential resources and centralized roles: PageTitle 36, SectionTitle 26, CardTitle 23, Body 21, SecondaryBody 19, Metadata 17, ButtonLabel 21, InputLabel 19, InputText 20. These are logical canvas units, not per-screen font choices. ThemedText applies the selected role from the shared theme.

Spacing: XS 6, SM 12, MD 20, LG 28, XL 40. Radius: panel 28, card 16, button/input 26. Border: 1.25 units. RoundedPanel renders native filled/bordered geometry; no glow or bloom effect is added. Icons use simple line geometry. The existing logo is referenced through a sprite rectangle on an unchanged copy of Homepage.png; no new logo was generated.

Central physical defaults in `MrDimensions`:

| Dimension | Starting value |
| --- | --- |
| Main panel | 1.18 × 0.70 m |
| Viewing distance | 1.10 m |
| Sidebar | 0.20 m |
| Top bar | 0.09 m |
| Button / input height | 0.052 / 0.054 m |
| Minimum interaction target | 0.048 m |
| Logical canvas resolution | 1000 units per meter |

MrPanelPlacement positions the panel once in world space at eye height and supports explicit recentering. It does not continuously follow head motion. Theme defaults can be adjusted centrally, then prefab assets rebuilt. Physical comfort remains a headset test, not a guarantee from these starting values.

## 5. Reusable components

PrimaryButton, SecondaryButton, IconButton, TextInput, PasswordInput, DropdownInput, SearchInput, StandardCard, ProjectCard shell, SidebarNavItem, TopBar, Sidebar, TabControl, StepIndicator, Stepper, StatusBadge, Avatar, SectionHeader, LoadingState, ErrorState, and EmptyState have reusable implementations and prefab-building definitions.

They expose callbacks and local presentation methods. They do not call HTTP, save settings, create projects, search editors, upload files, or execute auth flows. Password visibility is local control behavior. The component showcase is a separate verification scene rather than a new application page. Library rendering and interaction remain unverified until generated in Unity.

## 6. Navigation

ScreenRoute contains exactly the 15 requested routes. Group1Routes holds title, shell kind, sidebar selection, and wizard-step index. NavigationService owns an instance history stack and NavigationState; it supports Navigate, Back, and Reset. Same-route navigation does not add history; invalid enum values are rejected.

ScreenRegistry maps routes to explicit prefab references, validates completeness and duplicates, and never searches GameObjects by name. ScreenPresenter switches the correct shell and owns only the active view instance. Each placeholder has a title and empty content region. Wizard placeholders may show the common stepper.

The Editor Route Preview window can navigate every route and exercise Back. It requires an explicitly assigned composition object. It adds no runtime route, business screen, or sign-in bypass workflow.

## 7. Shells

AuthenticatedShell composes reusable sidebar/top-bar prefabs and a content region. Sidebar destinations are Home, Meetings, My Space, Inbox, divider, Settings. The top bar contains the existing logo/name over the left sidebar column, followed by project search, New Project, and Avatar, matching the references' overall placement.

Avatar → Profile, Settings → Settings, New Project → ProjectCreationBasics. There is no profile dropdown. Search emits an event only. The default application scene is intended to show Home as a foundation preview while SessionState remains unauthenticated.

PublicShell is separate: centered panel, existing brand, content slot, and Sign in/Sign up navigation. Landing/SignUp/SignIn use it without the authenticated sidebar. Forms are not implemented.

## 8. API client and DTOs

IApiClient defines typed GET, POST, PATCH, PUT, DELETE calls. ApiClient uses injectable IHttpTransport, explicit API base URL/timeout configuration, the shared JSON codec, and an access-token provider. UnityWebRequestTransport supplies Unity HTTP execution, cancellation, timeout, JSON upload/download handlers, and disabled redirects. It must be called on Unity's main thread.

Authenticated requests receive `Authorization: Bearer <token>`. Public requests omit it. Relative routes must stay below the configured base URL; absolute/escaped destinations are rejected so credentials cannot be forwarded to another origin. Known backend errors preserve HTTP status and error code/message; malformed/transport responses produce safe local errors. Unexpected success bodies must contain the data envelope. No raw response or token is logged.

DTOs were derived from the existing backend schemas/repositories/DTO functions. They preserve camelCase JSON, UUID/ISO strings, enum strings, nulls, and the `{data: ...}` / `{error: ...}` envelopes. They cover signup/login/refresh/logout, user/profile/preferences, organizations/members, projects/create command/result, editors, structures/layers, and sources/fixed metadata.

Important details: signup/login tokens are nested; refresh tokens are directly inside data. Source responses use hasFile, not an internal storage path. Optional request fields omit null where required, while profile patch flags allow explicit null clearing. Omitted structure layers use presets; an empty list remains distinct. Designation is a professional string, not project authorization.

No backend API flow was wired to a screen, no creation command was submitted, and no upload/file-picker behavior was added. Transport behavior on Unity itself remains untested; core client behavior was tested with an injected transport.

## 9. Auth/session foundation

SessionState owns copied user/token information and authenticated status. Access token expiry prevents returning an expired access token; a still-valid refresh session can remain authenticated for a later refresh workflow. Refresh expiry ends authentication. SessionService coordinates establishing/clearing local state and token storage. Screens own none of it.

ITokenStore is replaceable. The development implementation is memory-only; no plaintext credentials are written to PlayerPrefs or disk. Restart requires later sign-in. No automatic refresh, restoration, signup, login, or backend logout workflow has been implemented.

## 10. ProjectCreationDraft

ProjectCreationDraft independently holds name, description, selected OrganizationDto, project type, visibility, template key, LayersConfigured, layer definitions, source inputs, and selected organization members/editors. ProjectCreationDraftState owns the draft and emits changes. Navigation/view destruction does not reset it. Reset is explicit. ProjectListState is separate and owns copied list/loading/error state.

There is no project-create API call in this task, and no view/session/spatial/personal-space state container was introduced.

## 11. Tests and results

| Check | Result |
| --- | --- |
| Core C# compilation, C# 9 | Passed with Unity's bundled Roslyn compiler |
| Shared NUnit test sources | **47 passed, 0 failed/skipped** on .NET 8 with the actual resolved Unity Newtonsoft.Json DLL |
| Routing/history/public shell metadata | Passed core tests |
| Draft survives all wizard routes/back | Passed core tests |
| DTO success/error/null/request shapes | Passed core tests |
| Session copying, expiry, storage, cancellation | Passed core tests |
| HTTP methods, bearer/public distinction, errors, cancellation, URL confinement | Passed core tests |
| All application C# syntax | **86 files, 0 syntax errors**; syntax-only, not a Unity typecheck |
| Assembly-definition/plugin references | All resolve against downloaded packages/source |
| Native Unity EditMode tests | Added; **not run successfully** |
| Full Unity compilation | **Unverified** |
| Generated prefabs/scene | **Pending** |
| UI rendering/click behavior | **Unverified** |

`frontend-core-test-results.xml` contains the successful NUnit result. Unity-specific tests cover physical defaults, generated registry, required prefabs/targets, world-space canvas, direct avatar/settings/sidebar navigation, separate public shell, and retained wizard draft. They require a successfully built foundation and a functioning Editor. They are not included in the core-only result.

Run the repeatable core checks:

```powershell
cd C:\Users\Khushboo\Documents\Codex\2026-10-06\ju
.\unity\Tools\verify-core.ps1
.\unity\Tools\verify-syntax.ps1
```

The standalone runner directly invokes the installed Unity SDK compiler and NUnitLite, keeps downloaded verification libraries/build outputs under work/, and avoids user-level NuGet configuration. The test methods are the same source intended for Unity EditMode testing, not a second rewritten implementation.

## 12. Unity Editor verification and remaining action

Two Editor batch attempts resolved/imported packages but entered repeated `LicenseClient-Khushboo` connection refusals and compiler IL Post Processor connectivity retries. Allowing Unity's own user folders did not resolve the problem. No successful Editor compile or native test result was produced. This symptom matches a [reported Windows sandbox licensing issue](https://github.com/openai/codex/issues/50399); the exact underlying cause on this machine has not been proven.

To finish Task 1 verification, open the `unity` project under the normal Windows user in Unity Hub with 6000.5.6f1. After compilation, run **Adaptive Spatial Labs → Build Task 1 Foundation**, then inspect/play the application and component showcase. Run EditMode tests through Test Runner, or execute this from a normal PowerShell terminal:

```powershell
cd C:\Users\Khushboo\Documents\Codex\2026-10-06\ju
.\unity\Tools\verify-unity.ps1
```

That script builds the native assets, runs Unity tests, and checks the result file. It has a timeout so a failed licensing/IPC connection does not wait indefinitely. It is supplied for completion outside the blocked environment; it has not passed here. Resolve any actual Unity compile/asset/test errors before declaring Task 1 complete. No rendering screenshot is supplied because no native render has been verified.

## 13. Physical Quest checks

After Editor checks pass and Android Build Support is installed, verify panel comfort/readability at 1.1 m, ray/controller hit targets, trigger activation, input/keyboard behavior, dropdown scrolling, seated recentering, passthrough compositing, frame performance, and IL2CPP serialization. Confirm a reachable backend host configuration: `127.0.0.1` on Quest means the headset, not this PC. Hand interaction is a later input extension and has not been implemented or tested.

Task 1 remains the stopping point. No sign-in form behavior, project fetching, meeting/My Space/Inbox data, profile editing, settings persistence, editor search, file upload, project submission, architecture objects, 3D architecture rendering, views, realtime, AI, or decision workflow was implemented.

## Official references consulted

- [Unity Meta Quest packages](https://docs.unity.com/en-us/engine/6000.3/manual/xr/configuring-project-for/meta-quest-develop/packages)
- [XR Toolkit UI example requirements](https://github.com/Unity-Technologies/XR-Interaction-Toolkit-Examples/blob/main/Documentation/UI-2D.md)
- [Meta OpenXR passthrough camera](https://docs.unity.cn/Packages/com.unity.xr.meta-openxr%402.4/manual/features/camera.html)
- [NUnitLite runner](https://docs.nunit.org/api/NUnitLite.AutoRun.html)

Package APIs were additionally inspected in the exact downloaded package source. The older documentation links describe setup concepts; the manifest and installed source are authoritative for the pinned versions used here.
