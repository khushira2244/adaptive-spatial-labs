using System;
using UnityEngine;
using AdaptiveSpatialLabs.UI.Components.Buttons;

namespace AdaptiveSpatialLabs.UI.Components.Cards
{
    public sealed class ProjectCard : StandardCard
    {
        [SerializeField] private PrimaryButton open;
        public event Action OpenRequested;
        public void ConfigureAction(PrimaryButton button) => open = button;
        private void OnEnable() { if (open != null) open.Clicked += Emit; }
        private void OnDisable() { if (open != null) open.Clicked -= Emit; }
        private void Emit() => OpenRequested?.Invoke();
    }
}
