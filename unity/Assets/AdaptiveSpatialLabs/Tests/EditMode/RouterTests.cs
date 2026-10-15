using System;
using NUnit.Framework;
using AdaptiveSpatialLabs.Core.Navigation;

namespace AdaptiveSpatialLabs.Tests
{
    public sealed class RouterTests
    {
        [Test] public void RegistryHasExactlyTheFifteenGroup1Routes()
        { Assert.That(Group1Routes.All.Count,Is.EqualTo(15)); Assert.That(Enum.GetValues(typeof(ScreenRoute)).Length,Is.EqualTo(15)); }
        [Test] public void NavigateUpdatesCurrentAndBackRestoresIt()
        {
            var router=new NavigationService(new NavigationState()); router.Navigate(ScreenRoute.Home); router.Navigate(ScreenRoute.Profile);
            Assert.That(router.State.Current,Is.EqualTo(ScreenRoute.Profile)); Assert.That(router.State.CanGoBack,Is.True);
            Assert.That(router.Back(),Is.True); Assert.That(router.State.Current,Is.EqualTo(ScreenRoute.Home));
        }
        [Test] public void SameRouteDoesNotAddHistory()
        { var router=new NavigationService(new NavigationState()); router.Navigate(ScreenRoute.Landing); Assert.That(router.Back(),Is.False); }
        [Test] public void ResetClearsHistory()
        { var router=new NavigationService(new NavigationState()); router.Navigate(ScreenRoute.Home); router.Reset(); Assert.That(router.State.CanGoBack,Is.False); Assert.That(router.State.Current,Is.EqualTo(ScreenRoute.Landing)); }
        [Test] public void UnknownRoutesAreRejectedWithoutChangingState()
        { var router=new NavigationService(new NavigationState()); Assert.Throws<ArgumentOutOfRangeException>(()=>router.Navigate((ScreenRoute)999)); Assert.That(router.State.Current,Is.EqualTo(ScreenRoute.Landing)); }
        [TestCase(ScreenRoute.Landing)] [TestCase(ScreenRoute.SignIn)] [TestCase(ScreenRoute.SignUp)]
        public void PublicRoutesDoNotUseSidebarShell(ScreenRoute route)=>Assert.That(Group1Routes.Get(route).Shell,Is.EqualTo(ShellKind.Public));
        [Test] public void ProfileHasNoSidebarSelectionWhileSettingsSelectsSettings()
        { Assert.That(Group1Routes.Get(ScreenRoute.Profile).SidebarSelection,Is.Null); Assert.That(Group1Routes.Get(ScreenRoute.Settings).SidebarSelection,Is.EqualTo(ScreenRoute.Settings)); }
        [Test] public void WizardStepsHaveExplicitOrderAndHomeSelection()
        {
            var routes=new[] { ScreenRoute.ProjectCreationBasics,ScreenRoute.ProjectCreationStructure,ScreenRoute.ProjectCreationInputs,ScreenRoute.ProjectCreationEditors,ScreenRoute.ProjectCreationReview };
            for(var i=0;i<routes.Length;i++) { Assert.That(Group1Routes.Get(routes[i]).WizardStep,Is.EqualTo(i)); Assert.That(Group1Routes.Get(routes[i]).SidebarSelection,Is.EqualTo(ScreenRoute.Home)); }
        }
    }
}
