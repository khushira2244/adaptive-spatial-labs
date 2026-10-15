using System;
using UnityEngine;
using AdaptiveSpatialLabs.Core.Navigation;

namespace AdaptiveSpatialLabs.UI.Components.Sidebar
{
    public sealed class Sidebar : MonoBehaviour
    {
        [SerializeField] private SidebarNavItem[] items;
        public event Action<ScreenRoute> NavigateRequested;
        public SidebarNavItem[] Items => items;
        public void Configure(SidebarNavItem[] entries) => items=entries;
        private void OnEnable() { if(items==null)return; foreach(var item in items)item.Requested+=Emit; }
        private void OnDisable() { if(items==null)return; foreach(var item in items)item.Requested-=Emit; }
        private void Emit(ScreenRoute route) => NavigateRequested?.Invoke(route);
        public void Select(ScreenRoute? route) { foreach(var item in items) item.SetSelected(item.Route==route); }
    }
}
