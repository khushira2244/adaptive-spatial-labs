using System;
using UnityEngine;
using AdaptiveSpatialLabs.Core.Navigation;
using AdaptiveSpatialLabs.UI.Components.Buttons;
using AdaptiveSpatialLabs.UI.Components.Panels;
using AdaptiveSpatialLabs.UI.DesignSystem;

namespace AdaptiveSpatialLabs.UI.Components.Sidebar
{
    public sealed class SidebarNavItem : MonoBehaviour
    {
        [SerializeField] private ScreenRoute route;
        [SerializeField] private SecondaryButton action;
        [SerializeField] private RoundedPanel background;
        [SerializeField] private DesignTheme theme;
        public ScreenRoute Route => route;
        public event Action<ScreenRoute> Requested;
        public void Configure(ScreenRoute destination, SecondaryButton button, RoundedPanel panel, DesignTheme tokens)
        { route=destination; action=button; background=panel; theme=tokens; }
        private void OnEnable() { if (action != null) action.Clicked += Emit; }
        private void OnDisable() { if (action != null) action.Clicked -= Emit; }
        private void Emit() => Requested?.Invoke(route);
        public void SetSelected(bool selected)
        {
            var colors=action.Control.colors;
            colors.normalColor=selected?theme.Colors.NavigationSelected:theme.Colors.Panel;
            colors.highlightedColor=theme.Colors.NavigationSelected;
            action.Control.colors=colors;
            background.Style(selected ? theme.Colors.NavigationSelected : theme.Colors.Panel,
                selected ? theme.Colors.Primary : Color.clear,theme.Spacing.CardRadius,selected ? theme.Spacing.BorderThickness : 0);
        }
    }
}
