using TMPro;
using UnityEngine;
using AdaptiveSpatialLabs.UI.Components.Buttons;
using AdaptiveSpatialLabs.UI.Components.Badges;
using AdaptiveSpatialLabs.UI.Components.Stepper;
using AdaptiveSpatialLabs.UI.Components.Tabs;
using AdaptiveSpatialLabs.UI.DesignSystem;
using AdaptiveSpatialLabs.UI.DesignSystem.Icons;
using UserAvatar=AdaptiveSpatialLabs.UI.Components.Avatar.Avatar;

namespace AdaptiveSpatialLabs.Editor.UI
{
    internal static class CompositeFactory
    {
        public static UserAvatar Avatar(Transform parent,DesignTheme theme)
        {
            var button=ButtonFactory.Icon(parent,IconKind.User,theme); button.name="Avatar";
            var text=UiPrimitives.Text("Initials",button.transform,"",theme,TextStyle.ButtonLabel); UiPrimitives.Stretch(text.rectTransform,6,0,6,0); text.alignment=TextAlignmentOptions.Center;
            var avatar=button.gameObject.AddComponent<UserAvatar>(); avatar.Configure(button,text); return avatar;
        }
        public static StatusBadge Badge(Transform parent,DesignTheme theme)
        {
            var panel=UiPrimitives.Panel("StatusBadge",parent,theme,24); UiPrimitives.Place(panel.rectTransform,0,0,170,theme.Dimensions.TargetUnits);
            var text=UiPrimitives.Text("Label",panel.transform,"Status",theme,TextStyle.Metadata,true); UiPrimitives.Stretch(text.rectTransform,12,0,12,0); text.alignment=TextAlignmentOptions.Center;
            var badge=panel.gameObject.AddComponent<StatusBadge>(); badge.Configure(text,panel); badge.SetStatus("Private",theme.Colors.Private); return badge;
        }
        public static StepIndicator Step(Transform parent,DesignTheme theme,int number,string label)
        {
            var root=UiPrimitives.Rect("Step"+number,parent); UiPrimitives.Place(root,0,0,155,100);
            var circle=UiPrimitives.Panel("Circle",root,theme,100,theme.Colors.Panel); UiPrimitives.Place(circle.rectTransform,50,0,50,50);
            var digit=UiPrimitives.Text("Number",circle.transform,number.ToString(),theme,TextStyle.Body); UiPrimitives.Stretch(digit.rectTransform); digit.alignment=TextAlignmentOptions.Center;
            var caption=UiPrimitives.Text("Label",root,label,theme,TextStyle.Metadata,true); UiPrimitives.Place(caption.rectTransform,0,54,155,40); caption.alignment=TextAlignmentOptions.Center;
            var step=root.gameObject.AddComponent<StepIndicator>(); step.Configure(circle,digit,caption,theme); return step;
        }
        public static Stepper Steps(Transform parent,DesignTheme theme,float width)
        {
            var root=UiPrimitives.Rect("Stepper",parent); UiPrimitives.Place(root,0,0,width,100);
            var names=new[] { "Basics","Structure","Existing Inputs","Editors","Review" }; var steps=new StepIndicator[names.Length];
            var column=width/names.Length;
            for(var i=0;i<names.Length;i++)
            {
                if(i<names.Length-1)UiPrimitives.Divider(root,theme,i*column+column*.7f,25,column*.6f);
                steps[i]=Step(root,theme,i+1,names[i]); UiPrimitives.Place((RectTransform)steps[i].transform,i*column+(column-155)/2,0,155,100);
            }
            var stepper=root.gameObject.AddComponent<Stepper>(); stepper.Configure(steps); return stepper;
        }
        public static TabControl Tabs(Transform parent,DesignTheme theme)
        {
            var root=UiPrimitives.Rect("TabControl",parent); UiPrimitives.Place(root,0,0,600,theme.Dimensions.ButtonUnits);
            var labels=new[] { "Upcoming","Prepared","Past" }; var buttons=new SecondaryButton[labels.Length];
            for(var i=0;i<labels.Length;i++) { buttons[i]=ButtonFactory.Create<SecondaryButton>("Tab"+i,root,labels[i],theme); UiPrimitives.Place((RectTransform)buttons[i].transform,i*200,0,192,theme.Dimensions.ButtonUnits); }
            var tabs=root.gameObject.AddComponent<TabControl>(); tabs.Configure(buttons); return tabs;
        }
    }
}
