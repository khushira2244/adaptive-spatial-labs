using System;
using System.Collections.Generic;
using TMPro;
using UnityEngine;

namespace AdaptiveSpatialLabs.UI.Components.Dropdowns
{
    public sealed class DropdownInput : MonoBehaviour
    {
        [SerializeField] private TMP_Dropdown control;
        public TMP_Dropdown Control => control;
        public event Action<int> SelectionChanged;
        public void Configure(TMP_Dropdown dropdown) => control = dropdown;
        private void OnEnable() { if (control != null) control.onValueChanged.AddListener(Changed); }
        private void OnDisable() { if (control != null) control.onValueChanged.RemoveListener(Changed); }
        private void Changed(int value) => SelectionChanged?.Invoke(value);
        public void SetOptions(List<string> labels) { control.ClearOptions(); control.AddOptions(labels); }
    }
}
