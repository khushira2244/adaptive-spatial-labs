using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.UI;
using AdaptiveSpatialLabs.Editor.UI;

namespace AdaptiveSpatialLabs.Editor
{
    public static class ShowcaseBuilder
    {
        [MenuItem("Adaptive Spatial Labs/Build Component Showcase")]
        public static void Build()
        {
            var theme=AssetDatabase.LoadAssetAtPath<AdaptiveSpatialLabs.UI.DesignSystem.DesignTheme>(FoundationPaths.Theme);
            if(theme==null)throw new System.InvalidOperationException("Build the Task 1 foundation first.");
            EditorSceneManager.NewScene(NewSceneSetup.EmptyScene,NewSceneMode.Single);
            var camera=XrRigFactory.Create(); var canvas=FoundationBuilder.Canvas(theme,camera);
            var scrollRoot=UiPrimitives.Rect("ComponentScroll",canvas); UiPrimitives.Stretch(scrollRoot,32,32,32,32);
            var scroll=scrollRoot.gameObject.AddComponent<ScrollRect>(); scroll.horizontal=false;
            var viewport=UiPrimitives.Rect("Viewport",scrollRoot); UiPrimitives.Stretch(viewport); viewport.gameObject.AddComponent<RectMask2D>();
            var hit=viewport.gameObject.AddComponent<Image>(); hit.color=Color.clear; hit.raycastTarget=true;
            var content=UiPrimitives.Rect("ComponentLibrary",viewport); content.anchorMin=new Vector2(0,1); content.anchorMax=new Vector2(1,1); content.pivot=new Vector2(.5f,1);
            var layout=content.gameObject.AddComponent<VerticalLayoutGroup>(); layout.spacing=24; layout.childControlWidth=false; layout.childControlHeight=false; layout.childForceExpandWidth=false; layout.childForceExpandHeight=false;
            var fit=content.gameObject.AddComponent<ContentSizeFitter>(); fit.verticalFit=ContentSizeFitter.FitMode.PreferredSize;
            scroll.viewport=viewport; scroll.content=content;
            var files=Directory.GetFiles(FoundationPaths.Root+"/UI/Prefabs/Components","*.prefab",SearchOption.AllDirectories);
            System.Array.Sort(files,System.StringComparer.Ordinal);
            foreach(var path in files)
            {
                var prefab=AssetDatabase.LoadAssetAtPath<GameObject>(path.Replace('\\','/'));
                var instance=(GameObject)PrefabUtility.InstantiatePrefab(prefab,content);
                var rect=instance.GetComponent<RectTransform>(); var size=rect.sizeDelta;
                var element=instance.AddComponent<LayoutElement>(); element.preferredWidth=size.x; element.preferredHeight=Mathf.Min(size.y,180);
                if(instance.GetComponent<AdaptiveSpatialLabs.UI.Components.Sidebar.Sidebar>()!=null)element.preferredHeight=size.y;
            }
            EditorSceneManager.SaveScene(EditorSceneManager.GetActiveScene(),FoundationPaths.Showcase);
            Debug.Log("Component showcase saved. This is an Editor verification scene, not a product route.");
        }
    }
}
