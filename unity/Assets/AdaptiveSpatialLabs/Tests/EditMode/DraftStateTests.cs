using NUnit.Framework;
using AdaptiveSpatialLabs.Core.Navigation;
using AdaptiveSpatialLabs.Core.State;
using AdaptiveSpatialLabs.Models.Api;

namespace AdaptiveSpatialLabs.Tests
{
    public sealed class DraftStateTests
    {
        [Test] public void DraftSurvivesEveryWizardRouteAndBack()
        {
            var state=new ProjectCreationDraftState(); var router=new NavigationService(new NavigationState());
            state.Update(d=> { d.Name="Payments"; d.Organization=new OrganizationDto { Id="organization" }; d.Layers.Add(new ProjectLayerInput { Name="Custom",SortOrder=0 }); });
            var draft=state.Draft;
            foreach(var route in new[] { ScreenRoute.ProjectCreationBasics,ScreenRoute.ProjectCreationStructure,ScreenRoute.ProjectCreationInputs,ScreenRoute.ProjectCreationEditors,ScreenRoute.ProjectCreationReview })router.Navigate(route);
            router.Back(); Assert.That(state.Draft,Is.SameAs(draft)); Assert.That(state.Draft.Name,Is.EqualTo("Payments")); Assert.That(state.Draft.Layers[0].Name,Is.EqualTo("Custom"));
        }
        [Test] public void OnlyExplicitResetClearsDraft()
        { var state=new ProjectCreationDraftState(); state.Update(d=>d.Name="Saved draft"); state.Reset(); Assert.That(state.Draft.Name,Is.Empty); Assert.That(state.Draft.Layers,Is.Empty); }
        [Test] public void DraftStoresSourcesAndEligibleEditorsWithoutNetworkCalls()
        {
            var state=new ProjectCreationDraftState(); state.Update(d=> { d.Sources.Add(new ProjectSourceInput { Name="Document",SourceType="FILE",UploadId="staged" }); d.Editors.Add(new OrganizationMemberDto { Id="editor" }); });
            Assert.That(state.Draft.Sources.Count,Is.EqualTo(1)); Assert.That(state.Draft.Editors[0].Id,Is.EqualTo("editor"));
        }
        [Test] public void ProjectListStateCopiesDtosAndKeepsLoadingSeparate()
        {
            var state=new ProjectListState(); var project=new ProjectDto { Id="1",Name="Original" };
            state.BeginLoad(); Assert.That(state.IsLoading,Is.True); state.Replace(new[] { project }); project.Name="Changed externally";
            Assert.That(state.Items[0].Name,Is.EqualTo("Original")); var copy=state.Items[0]; copy.Name="Changed snapshot";
            Assert.That(state.Items[0].Name,Is.EqualTo("Original")); Assert.That(state.IsLoading,Is.False);
        }
    }
}
