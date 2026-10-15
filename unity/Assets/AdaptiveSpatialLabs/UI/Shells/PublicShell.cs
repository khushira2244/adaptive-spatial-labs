using System;
using UnityEngine;
using AdaptiveSpatialLabs.Core.Navigation;
using AdaptiveSpatialLabs.UI.Components.Buttons;

namespace AdaptiveSpatialLabs.UI.Shells
{
    public sealed class PublicShell : MonoBehaviour
    {
        [SerializeField] private RectTransform content;
        [SerializeField] private SecondaryButton signIn;
        [SerializeField] private PrimaryButton signUp;
        public RectTransform Content => content;
        public event Action<ScreenRoute> NavigateRequested;
        public void Configure(RectTransform region, SecondaryButton login, PrimaryButton signup)
        { content=region; signIn=login; signUp=signup; }
        private void OnEnable() { if(signIn!=null)signIn.Clicked+=Login; if(signUp!=null)signUp.Clicked+=Signup; }
        private void OnDisable() { if(signIn!=null)signIn.Clicked-=Login; if(signUp!=null)signUp.Clicked-=Signup; }
        private void Login()=>NavigateRequested?.Invoke(ScreenRoute.SignIn);
        private void Signup()=>NavigateRequested?.Invoke(ScreenRoute.SignUp);
    }
}
