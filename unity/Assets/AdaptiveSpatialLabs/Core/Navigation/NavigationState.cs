using System;

namespace AdaptiveSpatialLabs.Core.Navigation
{
    public sealed class NavigationState
    {
        public ScreenRoute Current { get; internal set; } = ScreenRoute.Landing;
        public bool CanGoBack { get; internal set; }
        public event Action Changed;
        internal void NotifyChanged() => Changed?.Invoke();
    }
}
