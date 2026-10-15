using UnityEngine;
using AdaptiveSpatialLabs.Core.Navigation;
using AdaptiveSpatialLabs.UI.DesignSystem;
using AdaptiveSpatialLabs.UI.Screens;

namespace AdaptiveSpatialLabs.Editor.UI
{
    internal static class ScreenFactory
    {
        public static ScreenView Placeholder(RouteDefinition route,DesignTheme theme)
        {
            var root=UiPrimitives.Rect(route.Route+"View"); UiPrimitives.Stretch(root);
            var title=UiPrimitives.Text("PageTitle",root,route.Title,theme,TextStyle.PageTitle); UiPrimitives.Place(title.rectTransform,0,0,900,58);
            if(route.Shell==ShellKind.Public)UiPrimitives.Place(title.rectTransform,0,0,660,70);
            AdaptiveSpatialLabs.UI.Components.Stepper.Stepper stepper=null;
            var content=UiPrimitives.Rect("EmptyContentRegion",root);
            if(route.WizardStep>=0)
            { stepper=CompositeFactory.Steps(root,theme,900); UiPrimitives.Place((RectTransform)stepper.transform,0,70,900,100); UiPrimitives.Stretch(content,0,190,0,0); }
            else UiPrimitives.Stretch(content,0,80,0,0);
            var screen=root.gameObject.AddComponent<ScreenView>(); screen.Configure(route.Route,title,content,stepper); return screen;
        }
        public static string Folder(ScreenRoute route)
        {
            switch(route)
            {
                case ScreenRoute.Landing:return "Landing";
                case ScreenRoute.SignUp:case ScreenRoute.SignIn:return "Auth";
                case ScreenRoute.Home:return "Home";
                case ScreenRoute.Meetings:return "Meetings";
                case ScreenRoute.MySpace:return "MySpace";
                case ScreenRoute.Inbox:return "Inbox";
                case ScreenRoute.Profile:return "Profile";
                case ScreenRoute.Settings:return "Settings";
                default:return "ProjectCreation";
            }
        }
    }
}
