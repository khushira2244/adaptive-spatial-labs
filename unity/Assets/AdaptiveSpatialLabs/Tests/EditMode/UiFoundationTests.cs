using System;
using System.Collections;
using NUnit.Framework;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.TestTools;
using AdaptiveSpatialLabs.App;
using AdaptiveSpatialLabs.Core.Navigation;
using AdaptiveSpatialLabs.Editor;
using AdaptiveSpatialLabs.UI.Components.Inputs;
using AdaptiveSpatialLabs.UI.DesignSystem;
using AdaptiveSpatialLabs.UI.Screens;

namespace AdaptiveSpatialLabs.Tests
{
    public sealed class UiFoundationTests
    {
        [Test] public void CentralPhysicalDimensionsMatchStartingRanges()
        {
            var d=new MrDimensions(); Assert.That(d.MainPanelWidthMeters,Is.InRange(1.15f,1.2f)); Assert.That(d.MainPanelHeightMeters,Is.InRange(.68f,.72f));
            Assert.That(d.ViewingDistanceMeters,Is.InRange(1f,1.2f)); Assert.That(d.SidebarWidthMeters,Is.InRange(.18f,.22f));
            Assert.That(d.TopBarHeightMeters,Is.InRange(.08f,.1f)); Assert.That(d.ButtonUnits/d.UnitsPerMeter,Is.GreaterThanOrEqualTo(d.MinimumTargetMeters));
        }
        [Test] public void GeneratedRegistryResolvesAllFifteenPrefabs()
        {
            var registry=AssetDatabase.LoadAssetAtPath<ScreenRegistry>(FoundationPaths.Registry);
            Assert.That(registry,Is.Not.Null,"Build Task 1 Foundation before running asset tests."); registry.Validate();
            foreach(var route in Group1Routes.All)Assert.That(registry.Resolve(route.Route).Route,Is.EqualTo(route.Route));
        }
        [Test] public void SceneHasOneWorldSpaceApplicationPanelAndNoProfileDropdown()
        {
            var app=OpenApp(); var canvas=app.Presenter.GetComponent<Canvas>(); Assert.That(canvas.renderMode,Is.EqualTo(RenderMode.WorldSpace));
            Assert.That(app.Presenter.AuthenticatedShell.TopBar.Avatar.GetComponentsInChildren<TMPro.TMP_Dropdown>(true),Is.Empty);
        }
        [UnityTest] public IEnumerator SidebarClicksAndAvatarRouteDirectlyAndPublicShellIsSeparate()
        {
            OpenApp(); yield return new EnterPlayMode();
            var app=CurrentApp(); var sidebar=app.Presenter.AuthenticatedShell.Sidebar;
            foreach(var item in sidebar.Items)
            { item.GetComponent<AdaptiveSpatialLabs.UI.Components.Buttons.SecondaryButton>().Control.onClick.Invoke(); Assert.That(app.Navigation.State.Current,Is.EqualTo(item.Route)); }
            app.Presenter.AuthenticatedShell.TopBar.Avatar.GetComponent<Button>().onClick.Invoke(); Assert.That(app.Navigation.State.Current,Is.EqualTo(ScreenRoute.Profile));
            app.Navigation.Navigate(ScreenRoute.SignIn); Assert.That(app.Presenter.PublicShell.gameObject.activeSelf,Is.True); Assert.That(app.Presenter.AuthenticatedShell.gameObject.activeSelf,Is.False);
            app.Navigation.Navigate(ScreenRoute.Home); Assert.That(app.Presenter.AuthenticatedShell.gameObject.activeSelf,Is.True); Assert.That(app.Session.IsAuthenticated,Is.False,"Preview must not fabricate authentication.");
            yield return new ExitPlayMode();
        }
        [Test] public void WizardNavigationRetainsDraftAndUsesEmptyPlaceholderContent()
        {
            var app=OpenApp(); app.Initialize(); app.Draft.Update(d=>d.Name="Retained");
            app.Navigation.Navigate(ScreenRoute.ProjectCreationBasics); app.Navigation.Navigate(ScreenRoute.ProjectCreationReview);
            Assert.That(app.Draft.Draft.Name,Is.EqualTo("Retained")); Assert.That(app.Presenter.CurrentView.Content.childCount,Is.EqualTo(0));
        }
        [Test] public void RequiredComponentPrefabsExistAndHavePhysicalButtonTargets()
        {
            var names=new[] { "Buttons/PrimaryButton","Buttons/SecondaryButton","Buttons/IconButton","Inputs/TextInput","Inputs/PasswordInput","Inputs/SearchInput","Dropdowns/DropdownInput","Cards/StandardCard","Cards/ProjectCard","Sidebar/SidebarNavItem","Sidebar/Sidebar","TopBar/TopBar","Tabs/TabControl","Stepper/StepIndicator","Stepper/Stepper","Badges/StatusBadge","Avatar/Avatar","Headers/SectionHeader","Loading/LoadingState","Errors/ErrorState","EmptyStates/EmptyState" };
            foreach(var name in names)
            {
                var prefab=AssetDatabase.LoadAssetAtPath<GameObject>(FoundationPaths.Root+"/UI/Prefabs/Components/"+name+".prefab"); Assert.That(prefab,Is.Not.Null,name);
                foreach(var button in prefab.GetComponentsInChildren<Button>(true))
                { var r=button.GetComponent<RectTransform>(); Assert.That(r.sizeDelta.y,Is.GreaterThanOrEqualTo(new MrDimensions().TargetUnits),name); }
            }
        }
        private static AppCompositionRoot OpenApp()
        {
            EditorSceneManager.OpenScene(FoundationPaths.Scene); return CurrentApp();
        }
        private static AppCompositionRoot CurrentApp()
        {
            var scene=UnityEngine.SceneManagement.SceneManager.GetActiveScene();
            foreach(var root in scene.GetRootGameObjects()) { var app=root.GetComponent<AppCompositionRoot>(); if(app!=null)return app; }
            throw new InvalidOperationException("Application composition is missing from the scene.");
        }
        [UnityTearDown] public IEnumerator CleanScene()
        { if(Application.isPlaying)yield return new ExitPlayMode(); EditorSceneManager.NewScene(NewSceneSetup.EmptyScene,NewSceneMode.Single); }
    }
}
