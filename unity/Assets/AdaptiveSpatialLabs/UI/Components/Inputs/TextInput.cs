using System;
using TMPro;
using UnityEngine;

namespace AdaptiveSpatialLabs.UI.Components.Inputs
{
    public class TextInput : MonoBehaviour
    {
        [SerializeField] protected TMP_InputField control;
        public event Action<string> ValueChanged;
        public event Action<string> Submitted;
        public TMP_InputField Control => control;
        public string Value { get => control.text; set => control.SetTextWithoutNotify(value ?? ""); }
        public void Configure(TMP_InputField input) => control = input;
        protected virtual void OnEnable()
        { if (control == null) return; control.onValueChanged.AddListener(Changed); control.onSubmit.AddListener(Submit); }
        protected virtual void OnDisable()
        { if (control == null) return; control.onValueChanged.RemoveListener(Changed); control.onSubmit.RemoveListener(Submit); }
        private void Changed(string value) => ValueChanged?.Invoke(value);
        private void Submit(string value) => Submitted?.Invoke(value);
        public void SetInteractable(bool value) => control.interactable = value;
    }
}
