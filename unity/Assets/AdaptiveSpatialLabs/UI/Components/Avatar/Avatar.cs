using System;
using TMPro;
using UnityEngine;
using AdaptiveSpatialLabs.UI.Components.Buttons;

namespace AdaptiveSpatialLabs.UI.Components.Avatar
{
    public sealed class Avatar : MonoBehaviour
    {
        [SerializeField] private IconButton action;
        [SerializeField] private TMP_Text initials;
        public event Action Clicked;
        public void Configure(IconButton button, TMP_Text text) { action = button; initials = text; }
        public void SetInitials(string value) => initials.text = value;
        private void OnEnable() { if (action != null) action.Clicked += Emit; }
        private void OnDisable() { if (action != null) action.Clicked -= Emit; }
        private void Emit() => Clicked?.Invoke();
    }
}
