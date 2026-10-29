using TMPro;
using UnityEditor;
using UnityEngine;
using UnityEngine.UI;
using AdaptiveSpatialLabs.UI.Components.Panels;
using AdaptiveSpatialLabs.UI.DesignSystem;
using AdaptiveSpatialLabs.UI.DesignSystem.Icons;
using ASLIconKind = AdaptiveSpatialLabs.UI.DesignSystem.Icons.IconKind;

namespace AdaptiveSpatialLabs.Editor.UI
{
    internal static class UiPrimitives
    {
        public static RectTransform Rect(string name,Transform parent=null)
        {
            var result=new GameObject(name,typeof(RectTransform)).GetComponent<RectTransform>();
            if(parent!=null)result.SetParent(parent,false); return result;
        }
        public static void Stretch(RectTransform rect,float left=0,float top=0,float right=0,float bottom=0)
        { rect.anchorMin=Vector2.zero; rect.anchorMax=Vector2.one; rect.offsetMin=new Vector2(left,bottom); rect.offsetMax=new Vector2(-right,-top); }
        public static void Place(RectTransform rect,float x,float y,float width,float height)
        { rect.anchorMin=rect.anchorMax=new Vector2(0,1); rect.pivot=new Vector2(0,1); rect.anchoredPosition=new Vector2(x,-y); rect.sizeDelta=new Vector2(width,height); }
        public static RoundedPanel Panel(string name,Transform parent,DesignTheme theme,float radius=-1,Color? fill=null)
        {
            var rect=Rect(name,parent); var panel=rect.gameObject.AddComponent<RoundedPanel>();
            panel.Style(fill??theme.Colors.PanelSecondary,theme.Colors.Border,radius<0?theme.Spacing.CardRadius:radius,theme.Spacing.BorderThickness);
            panel.raycastTarget=false; return panel;
        }
        public static TMP_Text Text(string name,Transform parent,string value,DesignTheme theme,TextStyle style=TextStyle.Body,bool secondary=false)
        {
            var rect=Rect(name,parent); var text=rect.gameObject.AddComponent<TextMeshProUGUI>();
            text.text=value; text.raycastTarget=false; text.enableAutoSizing=false; text.textWrappingMode=TextWrappingModes.Normal;
            text.overflowMode=TextOverflowModes.Ellipsis; text.alignment=TextAlignmentOptions.MidlineLeft;
            rect.gameObject.AddComponent<ThemedText>().Configure(theme,style,secondary); return text;
        }
        public static LineIcon Icon(string name,Transform parent,ASLIconKind kind,DesignTheme theme)
        { var icon=Rect(name,parent).gameObject.AddComponent<LineIcon>(); icon.Kind=kind; icon.color=theme.Colors.TextPrimary; icon.raycastTarget=false; return icon; }
        public static GameObject Save(GameObject instance,string relativePath)
        {
            var path=FoundationPaths.Root+"/"+relativePath;
            System.IO.Directory.CreateDirectory(System.IO.Path.GetDirectoryName(path));
            var prefab=PrefabUtility.SaveAsPrefabAsset(instance,path); Object.DestroyImmediate(instance); return prefab;
        }
        public static T CopyPrefab<T>(T prefab,Transform parent) where T:Component
        { var instance=(GameObject)PrefabUtility.InstantiatePrefab(prefab.gameObject,parent); return instance.GetComponent<T>(); }
        public static void Logo(Transform parent,DesignTheme theme,float x,float y,float size)
        {
            var logo=Rect("BrandLogo",parent); Place(logo,x,y,size,size);
            var image=logo.gameObject.AddComponent<Image>(); image.sprite=theme.BrandLogo; image.preserveAspect=true; image.raycastTarget=false;
        }
        public static void Divider(Transform parent,DesignTheme theme,float x,float y,float width)
        { var divider=Panel("Divider",parent,theme,0,theme.Colors.Border); divider.Style(theme.Colors.Border,Color.clear,0,0); Place(divider.rectTransform,x,y,width,theme.Spacing.BorderThickness); }
    }
}
