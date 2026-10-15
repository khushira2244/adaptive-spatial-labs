using System;
using UnityEngine;
using AdaptiveSpatialLabs.UI.Components.Buttons;
using AdaptiveSpatialLabs.UI.Components.Inputs;
using UserAvatar = AdaptiveSpatialLabs.UI.Components.Avatar.Avatar;

namespace AdaptiveSpatialLabs.UI.Components.TopBar
{
    public sealed class TopBar : MonoBehaviour
    {
        [SerializeField] private SearchInput search;
        [SerializeField] private PrimaryButton newProject;
        [SerializeField] private UserAvatar avatar;
        public event Action NewProjectRequested;
        public event Action ProfileRequested;
        public event Action<string> SearchChanged;
        public UserAvatar Avatar => avatar;
        public PrimaryButton NewProject => newProject;
        public void Configure(SearchInput input, PrimaryButton action, UserAvatar user)
        { search=input; newProject=action; avatar=user; }
        private void OnEnable()
        { if(search!=null)search.ValueChanged+=EmitSearch; if(newProject!=null)newProject.Clicked+=EmitProject; if(avatar!=null)avatar.Clicked+=EmitProfile; }
        private void OnDisable()
        { if(search!=null)search.ValueChanged-=EmitSearch; if(newProject!=null)newProject.Clicked-=EmitProject; if(avatar!=null)avatar.Clicked-=EmitProfile; }
        private void EmitSearch(string value) => SearchChanged?.Invoke(value);
        private void EmitProject() => NewProjectRequested?.Invoke();
        private void EmitProfile() => ProfileRequested?.Invoke();
    }
}
