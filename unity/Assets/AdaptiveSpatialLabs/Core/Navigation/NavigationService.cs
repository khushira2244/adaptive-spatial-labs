using System;
using System.Collections.Generic;

namespace AdaptiveSpatialLabs.Core.Navigation
{
    // Navigation owns only routes/history. It never creates UI objects, drafts, or auth sessions.
    public sealed class NavigationService
    {
        private readonly Stack<ScreenRoute> history = new Stack<ScreenRoute>();
        public NavigationState State { get; }

        public NavigationService(NavigationState state) => State = state ?? throw new ArgumentNullException(nameof(state));

        public void Navigate(ScreenRoute route, bool rememberCurrent = true)
        {
            Group1Routes.Get(route);
            if (State.Current == route) return;
            if (rememberCurrent) history.Push(State.Current);
            SetCurrent(route);
        }

        public bool Back()
        {
            if (history.Count == 0) return false;
            SetCurrent(history.Pop()); return true;
        }

        public void Reset(ScreenRoute route = ScreenRoute.Landing)
        {
            Group1Routes.Get(route); history.Clear(); SetCurrent(route);
        }

        private void SetCurrent(ScreenRoute route)
        {
            State.Current = route; State.CanGoBack = history.Count > 0; State.NotifyChanged();
        }
    }
}
