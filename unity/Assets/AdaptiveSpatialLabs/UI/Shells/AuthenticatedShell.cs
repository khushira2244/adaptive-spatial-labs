using UnityEngine;
using AdaptiveSpatialLabs.UI.Components.Sidebar;
using AdaptiveSpatialLabs.UI.Components.TopBar;

namespace AdaptiveSpatialLabs.UI.Shells
{
    public sealed class AuthenticatedShell : MonoBehaviour
    {
        [SerializeField] private Sidebar sidebar;
        [SerializeField] private TopBar topBar;
        [SerializeField] private RectTransform content;
        public Sidebar Sidebar => sidebar;
        public TopBar TopBar => topBar;
        public RectTransform Content => content;
        public void Configure(Sidebar navigation, TopBar header, RectTransform region)
        { sidebar=navigation; topBar=header; content=region; }
    }
}
