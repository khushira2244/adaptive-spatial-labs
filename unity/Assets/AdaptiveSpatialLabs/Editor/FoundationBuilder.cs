using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.XR.Interaction.Toolkit.UI;
using AdaptiveSpatialLabs.App;
using AdaptiveSpatialLabs.Core.Navigation;
using AdaptiveSpatialLabs.Editor.UI;
using AdaptiveSpatialLabs.UI.DesignSystem;
using AdaptiveSpatialLabs.UI.Screens;

namespace AdaptiveSpatialLabs.Editor
{
    public static class FoundationBuilder
    {
        [MenuItem("Adaptive Spatial Labs/Build Task 1 Foundation")]
        public static void Build()
        {
            if(EditorApplication.isPlaying)throw new System.InvalidOperationException("Stop Play mode before rebuilding assets.");
            Directory.CreateDirectory(FoundationPaths.Root+"/Scenes"); AssetDatabase.Refresh();
            var theme=ThemeAssetBuilder.Build(); var api=ThemeAssetBuilder.Api();
            ComponentLibraryBuilder.Build(theme);
            var registry=BuildRegistry(theme);
            var publicPrefab=UiPrimitives.Save(ShellFactory.Public(null,theme).gameObject,"UI/Prefabs/Shells/PublicShell.prefab");
            var memberPrefab=UiPrimitives.Save(ShellFactory.Authenticated(null,theme).gameObject,"UI/Prefabs/Shells/AuthenticatedShell.prefab");
            EditorSceneManager.NewScene(NewSceneSetup.EmptyScene,NewSceneMode.Single);
            var viewer=XrRigFactory.Create();
            var root=Canvas(theme,viewer);
            var publicShell=UiPrimitives.CopyPrefab(publicPrefab.GetComponent<AdaptiveSpatialLabs.UI.Shells.PublicShell>(),root);
            var memberShell=UiPrimitives.CopyPrefab(memberPrefab.GetComponent<AdaptiveSpatialLabs.UI.Shells.AuthenticatedShell>(),root);
            var presenter=root.gameObject.AddComponent<ScreenPresenter>(); presenter.Configure(registry,publicShell,memberShell);
            root.gameObject.AddComponent<MrPanelPlacement>().Configure(theme,viewer,root);
            var app=new GameObject("ApplicationComposition").AddComponent<AppCompositionRoot>(); app.Configure(api,presenter);
            var home=UiPrimitives.CopyPrefab(registry.Resolve(ScreenRoute.Home),memberShell.Content); home.Present(Group1Routes.Get(ScreenRoute.Home));
            presenter.SetInitialPreview(home);
            publicShell.gameObject.SetActive(false); memberShell.Sidebar.Select(ScreenRoute.Home);
            // Authenticated-shell preview only. No fake tokens/user/session are created.
            EditorSceneManager.SaveScene(EditorSceneManager.GetActiveScene(),FoundationPaths.Scene);
            EditorBuildSettings.scenes=new[] { new EditorBuildSettingsScene(FoundationPaths.Scene,true) };
            AssetDatabase.SaveAssets();
            QuestProjectSetup.Apply();
            Debug.Log("ASL Task 1 assets built: reusable component/shell prefabs, 15 route prefabs, central theme, scene, and Quest settings.");
        }
        private static ScreenRegistry BuildRegistry(DesignTheme theme)
        {
            var registrations=new ScreenRegistration[Group1Routes.All.Count];
            for(var i=0;i<registrations.Length;i++)
            {
                var route=Group1Routes.All[i]; var view=ScreenFactory.Placeholder(route,theme);
                var prefab=UiPrimitives.Save(view.gameObject,"UI/Screens/"+ScreenFactory.Folder(route.Route)+"/"+route.Route+".prefab");
                registrations[i]=new ScreenRegistration { Route=route.Route,Prefab=prefab.GetComponent<ScreenView>() };
            }
            var registry=AssetDatabase.LoadAssetAtPath<ScreenRegistry>(FoundationPaths.Registry);
            if(registry==null) { registry=ScriptableObject.CreateInstance<ScreenRegistry>(); AssetDatabase.CreateAsset(registry,FoundationPaths.Registry); }
            registry.Configure(registrations); registry.Validate(); EditorUtility.SetDirty(registry); return registry;
        }
        internal static RectTransform Canvas(DesignTheme theme,Camera camera)
        {
            var root=UiPrimitives.Rect("MRApplicationPanel"); root.sizeDelta=theme.Dimensions.PanelUnits;
            root.localScale=Vector3.one*theme.Dimensions.CanvasScale;
            root.position=camera.transform.position+Vector3.forward*theme.Dimensions.ViewingDistanceMeters;
            var canvas=root.gameObject.AddComponent<Canvas>(); canvas.renderMode=RenderMode.WorldSpace; canvas.worldCamera=camera;
            root.gameObject.AddComponent<TrackedDeviceGraphicRaycaster>();
            var background=UiPrimitives.Panel("ApplicationBackground",root,theme,theme.Spacing.PanelRadius,theme.Colors.Panel); UiPrimitives.Stretch(background.rectTransform);
            return root;
        }
    }
}
