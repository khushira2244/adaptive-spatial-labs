using UnityEngine;
using AdaptiveSpatialLabs.UI.Components.Buttons;

namespace AdaptiveSpatialLabs.UI.Components.Inputs
{
    public sealed class PasswordVisibilityToggle : MonoBehaviour
    {
        [SerializeField] private PasswordInput input;
        [SerializeField] private IconButton button;
        private bool visible;
        public void Configure(PasswordInput field,IconButton action) { input=field; button=action; }
        private void OnEnable() { if(button!=null)button.Clicked+=Toggle; }
        private void OnDisable() { if(button!=null)button.Clicked-=Toggle; }
        private void Toggle() { visible=!visible; input.SetVisible(visible); }
    }
}
