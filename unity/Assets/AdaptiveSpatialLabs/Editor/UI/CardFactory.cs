using TMPro;
using UnityEngine;
using AdaptiveSpatialLabs.UI.Components.Buttons;
using AdaptiveSpatialLabs.UI.Components.Cards;
using AdaptiveSpatialLabs.UI.Components.Headers;
using AdaptiveSpatialLabs.UI.Components.States;
using AdaptiveSpatialLabs.UI.DesignSystem;

namespace AdaptiveSpatialLabs.Editor.UI
{
    internal static class CardFactory
    {
        public static T Card<T>(Transform parent,DesignTheme theme,string title="Card title") where T:StandardCard
        {
            var panel=UiPrimitives.Panel(typeof(T).Name,parent,theme); UiPrimitives.Place(panel.rectTransform,0,0,700,150);
            var heading=UiPrimitives.Text("Title",panel.transform,title,theme,TextStyle.CardTitle); UiPrimitives.Place(heading.rectTransform,24,16,480,40);
            var content=UiPrimitives.Rect("Content",panel.transform); UiPrimitives.Stretch(content,24,64,24,20);
            var card=panel.gameObject.AddComponent<T>(); card.Configure(heading,content); return card;
        }
        public static ProjectCard Project(Transform parent,DesignTheme theme)
        {
            var card=Card<ProjectCard>(parent,theme,"Project name"); var open=ButtonFactory.Create<PrimaryButton>("Open",card.transform,"Open",theme,true);
            UiPrimitives.Place((RectTransform)open.transform,530,18,140,theme.Dimensions.ButtonUnits); card.ConfigureAction(open); return card;
        }
        public static SectionHeader Header(Transform parent,DesignTheme theme)
        {
            var root=UiPrimitives.Rect("SectionHeader",parent); UiPrimitives.Place(root,0,0,700,80);
            var title=UiPrimitives.Text("Title",root,"Section title",theme,TextStyle.SectionTitle); UiPrimitives.Place(title.rectTransform,0,0,700,40);
            var subtitle=UiPrimitives.Text("Subtitle",root,"Supporting information",theme,TextStyle.SecondaryBody,true); UiPrimitives.Place(subtitle.rectTransform,0,42,700,32);
            var header=root.gameObject.AddComponent<SectionHeader>(); header.Configure(title,subtitle); return header;
        }
        public static T Message<T>(Transform parent,DesignTheme theme,string title,string body,bool action=false) where T:MessageState
        {
            var panel=UiPrimitives.Panel(typeof(T).Name,parent,theme); UiPrimitives.Place(panel.rectTransform,0,0,700,180);
            var heading=UiPrimitives.Text("Title",panel.transform,title,theme,TextStyle.SectionTitle); UiPrimitives.Place(heading.rectTransform,28,18,640,42);
            var description=UiPrimitives.Text("Description",panel.transform,body,theme,TextStyle.SecondaryBody,true); UiPrimitives.Place(description.rectTransform,28,62,640,40);
            SecondaryButton button=null;
            if(action) { button=ButtonFactory.Create<SecondaryButton>("Action",panel.transform,"Try again",theme); UiPrimitives.Place((RectTransform)button.transform,28,114,170,theme.Dimensions.ButtonUnits); }
            var state=panel.gameObject.AddComponent<T>(); state.Configure(heading,description,button); return state;
        }
    }
}
