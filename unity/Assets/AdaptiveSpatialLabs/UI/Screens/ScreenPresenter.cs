using System;
using UnityEngine;
using AdaptiveSpatialLabs.Core.Navigation;
using AdaptiveSpatialLabs.UI.Shells;

namespace AdaptiveSpatialLabs.UI.Screens
{
    public sealed class ScreenPresenter : MonoBehaviour
    {
        [SerializeField] private ScreenRegistry registry;
        [SerializeField] private PublicShell publicShell;
        [SerializeField] private AuthenticatedShell authenticatedShell;
        private NavigationService navigation;
        [SerializeField] private ScreenView current;
        public ScreenView CurrentView => current;
        public PublicShell PublicShell => publicShell;
        public AuthenticatedShell AuthenticatedShell => authenticatedShell;
        public void Configure(ScreenRegistry screens,PublicShell guest,AuthenticatedShell member)
        { registry=screens; publicShell=guest; authenticatedShell=member; }
        public void SetInitialPreview(ScreenView view)=>current=view;
        public void Bind(NavigationService router)
        { Unbind(); registry.Validate(); navigation=router; navigation.State.Changed+=Render; Render(); }
        public void Unbind() { if(navigation!=null)navigation.State.Changed-=Render; navigation=null; }
        private void OnDestroy()=>Unbind();
        private void Render()
        {
            if(current!=null)
            { current.gameObject.SetActive(false); if(Application.isPlaying)Destroy(current.gameObject); else DestroyImmediate(current.gameObject); }
            var definition=Group1Routes.Get(navigation.State.Current);
            var isPublic=definition.Shell==ShellKind.Public;
            publicShell.gameObject.SetActive(isPublic); authenticatedShell.gameObject.SetActive(!isPublic);
            var parent=isPublic?publicShell.Content:authenticatedShell.Content;
            current=Instantiate(registry.Resolve(definition.Route),parent,false);
            current.gameObject.SetActive(true); current.Present(definition);
            authenticatedShell.Sidebar.Select(definition.SidebarSelection);
        }
    }
}
