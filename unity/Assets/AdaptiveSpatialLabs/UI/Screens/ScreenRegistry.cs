using System;
using System.Collections.Generic;
using UnityEngine;
using AdaptiveSpatialLabs.Core.Navigation;

namespace AdaptiveSpatialLabs.UI.Screens
{
    [Serializable]
    public sealed class ScreenRegistration { public ScreenRoute Route; public ScreenView Prefab; }
    [CreateAssetMenu(menuName="Adaptive Spatial Labs/Screen Registry")]
    public sealed class ScreenRegistry : ScriptableObject
    {
        [SerializeField] private ScreenRegistration[] screens;
        private Dictionary<ScreenRoute,ScreenView> lookup;
        public void Configure(ScreenRegistration[] registrations) { screens=registrations; lookup=null; }
        public void Validate()
        {
            lookup=new Dictionary<ScreenRoute,ScreenView>();
            if(screens==null)throw new InvalidOperationException("Screen registry is empty.");
            foreach(var entry in screens)
            { if(entry.Prefab==null||lookup.ContainsKey(entry.Route)||entry.Prefab.Route!=entry.Route)throw new InvalidOperationException("Screen registration is missing, duplicated, or mismatched."); Group1Routes.Get(entry.Route); lookup.Add(entry.Route,entry.Prefab); }
            foreach(var route in Group1Routes.All)if(!lookup.ContainsKey(route.Route))throw new InvalidOperationException("Missing Group 1 screen: "+route.Route);
        }
        public ScreenView Resolve(ScreenRoute route) { if(lookup==null)Validate(); return lookup[route]; }
    }
}
