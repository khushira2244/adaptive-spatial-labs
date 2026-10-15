using System;
using TMPro;
using UnityEngine;
using UnityEngine.UI;
using AdaptiveSpatialLabs.UI.DesignSystem;

namespace AdaptiveSpatialLabs.UI.Components.Buttons
{
    [RequireComponent(typeof(Button))]
    public class ActionButton : MonoBehaviour
    {
        [SerializeField] private TMP_Text label;
        [SerializeField] private Button control;
        public event Action Clicked;
        public Button Control => control;
        public void Configure(Button button, TMP_Text text)
        { control = button; label = text; }
        private void OnEnable() { if (control != null) control.onClick.AddListener(Emit); }
        private void OnDisable() { if (control != null) control.onClick.RemoveListener(Emit); }
        private void Emit() => Clicked?.Invoke();
        public void SetLabel(string value) { if (label != null) label.text = value; }
        public void SetState(ControlState state)
        {
            control.interactable = state != ControlState.Disabled && state != ControlState.Loading;
            if (state == ControlState.Selected) control.Select();
        }
    }
}
