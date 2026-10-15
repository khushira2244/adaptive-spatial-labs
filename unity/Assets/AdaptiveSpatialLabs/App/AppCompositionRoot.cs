using UnityEngine;
using AdaptiveSpatialLabs.Core.Auth;
using AdaptiveSpatialLabs.Core.Configuration;
using AdaptiveSpatialLabs.Core.Navigation;
using AdaptiveSpatialLabs.Core.Networking;
using AdaptiveSpatialLabs.Core.State;
using AdaptiveSpatialLabs.Services.Api;
using AdaptiveSpatialLabs.Services.Session;
using AdaptiveSpatialLabs.Services.Storage;
using AdaptiveSpatialLabs.UI.Screens;

namespace AdaptiveSpatialLabs.App
{
    // Composition only. No singleton, HTTP workflow, domain orchestration, or screen business logic.
    public sealed class AppCompositionRoot : MonoBehaviour
    {
        [SerializeField] private ApiConfiguration apiConfiguration;
        [SerializeField] private ScreenPresenter presenter;
        [SerializeField] private ScreenRoute initialRoute=ScreenRoute.Home;
        public NavigationService Navigation { get; private set; }
        public SessionState Session { get; private set; }
        public SessionService SessionService { get; private set; }
        public ProjectListState Projects { get; private set; }
        public ProjectCreationDraftState Draft { get; private set; }
        public IApiClient Api { get; private set; }
        public ScreenPresenter Presenter=>presenter;
        public void Configure(ApiConfiguration api,ScreenPresenter screens,ScreenRoute route=ScreenRoute.Home)
        { apiConfiguration=api; presenter=screens; initialRoute=route; }
        private void Awake()=>Initialize();
        public void Initialize()
        {
            if(Navigation!=null)return;
            Navigation=new NavigationService(new NavigationState());
            Session=new SessionState(); SessionService=new SessionService(Session,new InMemoryTokenStore());
            Projects=new ProjectListState(); Draft=new ProjectCreationDraftState();
            Api=new ApiClient(apiConfiguration.CreateOptions(),new UnityWebRequestTransport(),Session);
            Navigation.Reset(initialRoute); presenter.Bind(Navigation);
            presenter.AuthenticatedShell.Sidebar.NavigateRequested+=Navigate;
            presenter.AuthenticatedShell.TopBar.NewProjectRequested+=NewProject;
            presenter.AuthenticatedShell.TopBar.ProfileRequested+=Profile;
            presenter.PublicShell.NavigateRequested+=Navigate;
        }
        private void Navigate(ScreenRoute route)=>Navigation.Navigate(route);
        private void NewProject()=>Navigation.Navigate(ScreenRoute.ProjectCreationBasics);
        private void Profile()=>Navigation.Navigate(ScreenRoute.Profile);
        private void OnDestroy()
        {
            if(presenter==null||Navigation==null)return;
            presenter.Unbind();
            presenter.AuthenticatedShell.Sidebar.NavigateRequested-=Navigate;
            presenter.AuthenticatedShell.TopBar.NewProjectRequested-=NewProject;
            presenter.AuthenticatedShell.TopBar.ProfileRequested-=Profile;
            presenter.PublicShell.NavigateRequested-=Navigate;
        }
    }
}
