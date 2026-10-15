using TMPro;
using UnityEngine;
using UnityEngine.UI;
using AdaptiveSpatialLabs.UI.Components.Buttons;
using AdaptiveSpatialLabs.UI.DesignSystem;
using AdaptiveSpatialLabs.UI.DesignSystem.Icons;

namespace AdaptiveSpatialLabs.Editor.UI
{
    internal static class ButtonFactory
    {
        public static T Create<T>(string name,Transform parent,string label,DesignTheme theme,bool primary=false,IconKind? icon=null) where T:ActionButton
        {
            var background=UiPrimitives.Panel(name,parent,theme,theme.Spacing.ButtonRadius,primary?theme.Colors.Primary:theme.Colors.PanelSecondary);
            background.raycastTarget=true;
            UiPrimitives.Place(background.rectTransform,0,0,primary?170:150,theme.Dimensions.ButtonUnits);
            var button=background.gameObject.AddComponent<Button>(); button.targetGraphic=background;
            button.navigation=new Navigation { mode=Navigation.Mode.None };
            var normal=primary?theme.Colors.Primary:theme.Colors.PanelSecondary;
            button.colors=new ColorBlock { normalColor=normal,highlightedColor=primary?theme.Colors.PrimaryHover:theme.Colors.NavigationSelected,pressedColor=theme.Colors.NavigationSelected,selectedColor=theme.Colors.NavigationSelected,disabledColor=theme.Colors.Disabled,colorMultiplier=1,fadeDuration=.1f };
            var text=UiPrimitives.Text("Label",background.transform,label,theme,TextStyle.ButtonLabel);
            text.alignment=TextAlignmentOptions.Center;
            UiPrimitives.Stretch(text.rectTransform,icon.HasValue?42:theme.Spacing.Sm,0,theme.Spacing.Sm,0);
            if(icon.HasValue) { var glyph=UiPrimitives.Icon("Icon",background.transform,icon.Value,theme); UiPrimitives.Place(glyph.rectTransform,theme.Spacing.Sm,14,24,24); }
            var wrapper=background.gameObject.AddComponent<T>(); wrapper.Configure(button,text); return wrapper;
        }
        public static IconButton Icon(Transform parent,IconKind kind,DesignTheme theme)
        {
            var button=Create<IconButton>(kind+"Button",parent,"",theme,false);
            UiPrimitives.Place((RectTransform)button.transform,0,0,theme.Dimensions.TargetUnits,theme.Dimensions.TargetUnits);
            var icon=UiPrimitives.Icon("Icon",button.transform,kind,theme); UiPrimitives.Stretch(icon.rectTransform,12,12,12,12); return button;
        }
    }
}
