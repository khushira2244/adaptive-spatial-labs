using System.Collections.Generic;
using UnityEngine;
using AdaptiveSpatialLabs.Core.Navigation;
using AdaptiveSpatialLabs.UI.Components.Buttons;
using AdaptiveSpatialLabs.UI.Components.Inputs;
using AdaptiveSpatialLabs.UI.Components.Sidebar;
using AdaptiveSpatialLabs.UI.Components.TopBar;
using AdaptiveSpatialLabs.UI.DesignSystem;
using AdaptiveSpatialLabs.UI.DesignSystem.Icons;
using AdaptiveSpatialLabs.UI.Shells;

namespace AdaptiveSpatialLabs.Editor.UI
{
    internal static class ShellFactory
    {
        public static Sidebar Sidebar(Transform parent,DesignTheme theme)
        {
            var root=UiPrimitives.Rect("Sidebar",parent); UiPrimitives.Place(root,0,0,theme.Dimensions.SidebarUnits,theme.Dimensions.PanelUnits.y);
            UiPrimitives.Divider(root,theme,theme.Dimensions.SidebarUnits-1,20,1);
            var vertical=UiPrimitives.Panel("VerticalDivider",root,theme,0,theme.Colors.Border); UiPrimitives.Place(vertical.rectTransform,theme.Dimensions.SidebarUnits-1,20,1,theme.Dimensions.PanelUnits.y-40);
            var routes=new[] { ScreenRoute.Home,ScreenRoute.Meetings,ScreenRoute.MySpace,ScreenRoute.Inbox,ScreenRoute.Settings };
            var labels=new[] { "Home","Meetings","My Space","Inbox","Settings" };
            var icons=new[] { IconKind.Home,IconKind.Meetings,IconKind.Cube,IconKind.Mail,IconKind.Settings };
            var items=new List<SidebarNavItem>();
            for(var i=0;i<routes.Length;i++)
            {
                var y=112+i*78+(i==4?30:0);
                var button=ButtonFactory.Create<SecondaryButton>(labels[i],root,labels[i],theme,false,icons[i]);
                UiPrimitives.Place((RectTransform)button.transform,12,y,theme.Dimensions.SidebarUnits-24,theme.Dimensions.ButtonUnits+8);
                var item=button.gameObject.AddComponent<SidebarNavItem>(); item.Configure(routes[i],button,button.GetComponent<AdaptiveSpatialLabs.UI.Components.Panels.RoundedPanel>(),theme); items.Add(item);
            }
            UiPrimitives.Divider(root,theme,20,112+4*78-10,theme.Dimensions.SidebarUnits-40);
            var sidebar=root.gameObject.AddComponent<Sidebar>(); sidebar.Configure(items.ToArray()); return sidebar;
        }
        public static TopBar TopBar(Transform parent,DesignTheme theme,float width)
        {
            var root=UiPrimitives.Rect("TopBar",parent); UiPrimitives.Place(root,0,0,width,theme.Dimensions.TopBarUnits);
            UiPrimitives.Logo(root,theme,16,25,42);
            var brand=UiPrimitives.Text("BrandName",root,"Adaptive\nSpatial Labs",theme,TextStyle.InputLabel); UiPrimitives.Place(brand.rectTransform,66,20,125,54);
            var contentX=theme.Dimensions.SidebarUnits+theme.Spacing.Lg;
            var contentWidth=width-contentX-theme.Spacing.Lg;
            var search=InputFactory.Text<SearchInput>(root,"Search projects",theme,false,true);
            UiPrimitives.Place((RectTransform)search.transform,contentX,18,contentWidth-260,theme.Dimensions.InputUnits);
            var create=ButtonFactory.Create<PrimaryButton>("NewProject",root,"New Project",theme,true,IconKind.Plus);
            UiPrimitives.Place((RectTransform)create.transform,contentX+contentWidth-244,18,176,theme.Dimensions.ButtonUnits);
            var avatar=CompositeFactory.Avatar(root,theme); UiPrimitives.Place((RectTransform)avatar.transform,contentX+contentWidth-52,20,theme.Dimensions.TargetUnits,theme.Dimensions.TargetUnits);
            var bar=root.gameObject.AddComponent<TopBar>(); bar.Configure(search,create,avatar); return bar;
        }
        public static AuthenticatedShell Authenticated(Transform parent,DesignTheme theme)
        {
            var root=UiPrimitives.Rect("AuthenticatedShell",parent); UiPrimitives.Stretch(root);
            var sidebarPrefab=UnityEditor.AssetDatabase.LoadAssetAtPath<Sidebar>(FoundationPaths.Root+"/UI/Prefabs/Components/Sidebar/Sidebar.prefab");
            var sidebar=sidebarPrefab!=null?UiPrimitives.CopyPrefab(sidebarPrefab,root):Sidebar(root,theme); var contentX=theme.Dimensions.SidebarUnits+theme.Spacing.Lg;
            var width=theme.Dimensions.PanelUnits.x-contentX-theme.Spacing.Lg;
            var headerPrefab=UnityEditor.AssetDatabase.LoadAssetAtPath<TopBar>(FoundationPaths.Root+"/UI/Prefabs/Components/TopBar/TopBar.prefab");
            var header=headerPrefab!=null?UiPrimitives.CopyPrefab(headerPrefab,root):TopBar(root,theme,theme.Dimensions.PanelUnits.x); UiPrimitives.Place((RectTransform)header.transform,0,0,theme.Dimensions.PanelUnits.x,theme.Dimensions.TopBarUnits);
            var content=UiPrimitives.Rect("Content",root); UiPrimitives.Stretch(content,contentX,theme.Dimensions.TopBarUnits+theme.Spacing.Sm,theme.Spacing.Lg,theme.Spacing.Lg);
            var shell=root.gameObject.AddComponent<AuthenticatedShell>(); shell.Configure(sidebar,header,content); return shell;
        }
        public static PublicShell Public(Transform parent,DesignTheme theme)
        {
            var root=UiPrimitives.Rect("PublicShell",parent); UiPrimitives.Stretch(root);
            UiPrimitives.Logo(root,theme,32,26,44);
            var brand=UiPrimitives.Text("BrandName",root,"Adaptive Spatial Labs",theme,TextStyle.CardTitle); UiPrimitives.Place(brand.rectTransform,90,20,460,54);
            var card=UiPrimitives.Panel("CenteredPanel",root,theme,theme.Spacing.PanelRadius,theme.Colors.Panel);
            var width=theme.Dimensions.PanelUnits.x; var height=theme.Dimensions.PanelUnits.y;
            UiPrimitives.Place(card.rectTransform,(width-740)/2,106,740,height-146);
            UiPrimitives.Logo(card.transform,theme,340,30,60);
            var content=UiPrimitives.Rect("Content",card.transform); UiPrimitives.Stretch(content,40,110,40,120);
            var login=ButtonFactory.Create<SecondaryButton>("SignIn",card.transform,"Sign in",theme);
            var signup=ButtonFactory.Create<PrimaryButton>("SignUp",card.transform,"Sign up",theme,true);
            UiPrimitives.Place((RectTransform)login.transform,150,height-240,190,theme.Dimensions.ButtonUnits);
            UiPrimitives.Place((RectTransform)signup.transform,370,height-240,190,theme.Dimensions.ButtonUnits);
            var shell=root.gameObject.AddComponent<PublicShell>(); shell.Configure(content,login,signup); return shell;
        }
    }
}
