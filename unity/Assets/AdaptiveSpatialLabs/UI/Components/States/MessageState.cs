using System;
using TMPro;
using UnityEngine;
using AdaptiveSpatialLabs.UI.Components.Buttons;

namespace AdaptiveSpatialLabs.UI.Components.States
{
    public class MessageState : MonoBehaviour
    {
        [SerializeField] private TMP_Text heading;
        [SerializeField] private TMP_Text description;
        [SerializeField] private SecondaryButton action;
        public event Action ActionRequested;
        public void Configure(TMP_Text title,TMP_Text body,SecondaryButton button=null)
        { heading=title; description=body; action=button; }
        public void SetMessage(string title,string body) { heading.text=title; description.text=body; }
        private void OnEnable() { if(action!=null)action.Clicked+=Emit; }
        private void OnDisable() { if(action!=null)action.Clicked-=Emit; }
        private void Emit()=>ActionRequested?.Invoke();
    }
}
