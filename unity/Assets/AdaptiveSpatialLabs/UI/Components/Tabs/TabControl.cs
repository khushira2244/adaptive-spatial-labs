using System;
using UnityEngine;
using AdaptiveSpatialLabs.UI.Components.Buttons;
using AdaptiveSpatialLabs.UI.DesignSystem;

namespace AdaptiveSpatialLabs.UI.Components.Tabs
{
    public sealed class TabControl : MonoBehaviour
    {
        [SerializeField] private SecondaryButton[] tabs;
        public int SelectedIndex { get; private set; }
        public event Action<int> Selected;
        private Action[] handlers;
        public void Configure(SecondaryButton[] buttons) => tabs=buttons;
        private void OnEnable()
        {
            if(tabs==null)return; handlers=new Action[tabs.Length];
            for(var i=0;i<tabs.Length;i++) { var index=i; handlers[i]=()=>Select(index); tabs[i].Clicked+=handlers[i]; }
        }
        private void OnDisable() { if(handlers==null)return; for(var i=0;i<tabs.Length;i++)tabs[i].Clicked-=handlers[i]; }
        public void Select(int index)
        { if(index<0||index>=tabs.Length)throw new ArgumentOutOfRangeException(nameof(index)); SelectedIndex=index; for(var i=0;i<tabs.Length;i++)tabs[i].SetState(i==index?ControlState.Selected:ControlState.Normal); Selected?.Invoke(index); }
    }
}
