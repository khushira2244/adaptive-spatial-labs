using TMPro;
using UnityEngine;
using UnityEngine.UI;
using AdaptiveSpatialLabs.UI.Components.Inputs;
using AdaptiveSpatialLabs.UI.Components.Dropdowns;
using AdaptiveSpatialLabs.UI.DesignSystem;
using AdaptiveSpatialLabs.UI.DesignSystem.Icons;

namespace AdaptiveSpatialLabs.Editor.UI
{
    internal static class InputFactory
    {
        public static T Text<T>(Transform parent,string placeholder,DesignTheme theme,bool password=false,bool search=false) where T:TextInput
        {
            var panel=UiPrimitives.Panel(typeof(T).Name,parent,theme,theme.Spacing.InputRadius);
            panel.raycastTarget=true; UiPrimitives.Place(panel.rectTransform,0,0,420,theme.Dimensions.InputUnits);
            var input=panel.gameObject.AddComponent<TMP_InputField>(); input.targetGraphic=panel;
            input.navigation=new Navigation { mode=Navigation.Mode.None };
            var viewport=UiPrimitives.Rect("Viewport",panel.transform); UiPrimitives.Stretch(viewport,search?48:20,8,password?64:20,8); viewport.gameObject.AddComponent<RectMask2D>();
            var text=UiPrimitives.Text("Text",viewport,"",theme,TextStyle.InputText); UiPrimitives.Stretch(text.rectTransform);
            var hint=UiPrimitives.Text("Placeholder",viewport,placeholder,theme,TextStyle.InputText,true); UiPrimitives.Stretch(hint.rectTransform);
            input.textViewport=viewport; input.textComponent=(TextMeshProUGUI)text; input.placeholder=hint;
            input.contentType=password?TMP_InputField.ContentType.Password:TMP_InputField.ContentType.Standard;
            input.characterLimit=search?100:200; input.caretColor=theme.Colors.Primary;
            var component=panel.gameObject.AddComponent<T>(); component.Configure(input);
            if(search) { var icon=UiPrimitives.Icon("Search",panel.transform,IconKind.Search,theme); UiPrimitives.Place(icon.rectTransform,14,14,26,26); }
            if(password)
            {
                var toggle=ButtonFactory.Icon(panel.transform,IconKind.Eye,theme);
                var rect=(RectTransform)toggle.transform; rect.anchorMin=rect.anchorMax=new Vector2(1,.5f); rect.pivot=new Vector2(1,.5f); rect.anchoredPosition=new Vector2(-3,0);
                // Visibility is local component behavior, never an authentication action.
                toggle.gameObject.AddComponent<PasswordVisibilityToggle>().Configure((PasswordInput)(TextInput)component,toggle);
            }
            return component;
        }
        public static DropdownInput Dropdown(Transform parent,DesignTheme theme)
        {
            var panel=UiPrimitives.Panel("DropdownInput",parent,theme,theme.Spacing.InputRadius); panel.raycastTarget=true;
            UiPrimitives.Place(panel.rectTransform,0,0,420,theme.Dimensions.InputUnits);
            var dropdown=panel.gameObject.AddComponent<TMP_Dropdown>(); dropdown.targetGraphic=panel;
            var caption=UiPrimitives.Text("Caption",panel.transform,"Select an option",theme,TextStyle.InputText,true); UiPrimitives.Stretch(caption.rectTransform,20,0,60,0); dropdown.captionText=(TextMeshProUGUI)caption;
            var chevron=UiPrimitives.Icon("Chevron",panel.transform,IconKind.ChevronDown,theme); UiPrimitives.Place(chevron.rectTransform,374,15,24,24);
            var template=UiPrimitives.Panel("Template",panel.transform,theme); var rect=template.rectTransform;
            rect.anchorMin=rect.anchorMax=new Vector2(0,0); rect.pivot=new Vector2(0,1); rect.anchoredPosition=new Vector2(0,-6); rect.sizeDelta=new Vector2(420,180);
            var scroll=template.gameObject.AddComponent<ScrollRect>(); scroll.horizontal=false;
            var viewport=UiPrimitives.Rect("Viewport",template.transform); UiPrimitives.Stretch(viewport,4,4,4,4); viewport.gameObject.AddComponent<RectMask2D>();
            var content=UiPrimitives.Rect("Content",viewport); UiPrimitives.Stretch(content); scroll.viewport=viewport; scroll.content=content;
            var item=UiPrimitives.Panel("Item",content,theme,8); UiPrimitives.Place(item.rectTransform,0,0,412,theme.Dimensions.TargetUnits); item.raycastTarget=true;
            var toggle=item.gameObject.AddComponent<Toggle>(); toggle.targetGraphic=item;
            var selected=UiPrimitives.Panel("Selected",item.transform,theme,8,theme.Colors.NavigationSelected); UiPrimitives.Stretch(selected.rectTransform); toggle.graphic=selected;
            var text=UiPrimitives.Text("Label",item.transform,"Option",theme,TextStyle.InputText); UiPrimitives.Stretch(text.rectTransform,12,0,12,0); dropdown.itemText=(TextMeshProUGUI)text;
            dropdown.template=rect; dropdown.options=new System.Collections.Generic.List<TMP_Dropdown.OptionData> { new TMP_Dropdown.OptionData("Option A"),new TMP_Dropdown.OptionData("Option B") }; template.gameObject.SetActive(false);
            var component=panel.gameObject.AddComponent<DropdownInput>(); component.Configure(dropdown); return component;
        }
    }
}
