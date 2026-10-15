using System.IO;
using TMPro;
using UnityEditor;
using UnityEditor.PackageManager;
using UnityEngine;
using AdaptiveSpatialLabs.Core.Configuration;
using AdaptiveSpatialLabs.UI.DesignSystem;

namespace AdaptiveSpatialLabs.Editor
{
    internal static class ThemeAssetBuilder
    {
        public static DesignTheme Build()
        {
            Directory.CreateDirectory(FoundationPaths.Root+"/Configuration"); AssetDatabase.Refresh();
            if(AssetDatabase.LoadAssetAtPath<TMP_FontAsset>("Assets/TextMesh Pro/Resources/Fonts & Materials/LiberationSans SDF.asset")==null)
            {
                var package=PackageInfo.FindForAssembly(typeof(TMP_Text).Assembly);
                AssetDatabase.ImportPackage(Path.Combine(package.resolvedPath,"Package Resources/TMP Essential Resources.unitypackage"),false);
                AssetDatabase.Refresh();
            }
            var theme=AssetDatabase.LoadAssetAtPath<DesignTheme>(FoundationPaths.Theme);
            if(theme==null) { theme=ScriptableObject.CreateInstance<DesignTheme>(); AssetDatabase.CreateAsset(theme,FoundationPaths.Theme); }
            theme.Font=AssetDatabase.LoadAssetAtPath<TMP_FontAsset>("Assets/TextMesh Pro/Resources/Fonts & Materials/LiberationSans SDF.asset");
            if(theme.Font==null)throw new System.InvalidOperationException("TextMeshPro essential font import did not finish. Re-run Build Foundation after import.");
            var screenshot=AssetDatabase.LoadAssetAtPath<Texture2D>(FoundationPaths.Root+"/Brand/ReferenceBrand.png");
            if(screenshot!=null)
            {
                var importer=(TextureImporter)AssetImporter.GetAtPath(AssetDatabase.GetAssetPath(screenshot));
                importer.textureType=TextureImporterType.Sprite; importer.spriteImportMode=SpriteImportMode.Multiple; importer.mipmapEnabled=false; importer.textureCompression=TextureImporterCompression.Uncompressed;
#pragma warning disable CS0618
                importer.spritesheet=new[] { new SpriteMetaData { name="ASLLogo",rect=new Rect(108,screenshot.height-172,64,62),alignment=(int)SpriteAlignment.Center,pivot=new Vector2(.5f,.5f) } };
#pragma warning restore CS0618
                importer.SaveAndReimport();
                foreach(var asset in AssetDatabase.LoadAllAssetsAtPath(AssetDatabase.GetAssetPath(screenshot)))if(asset is Sprite sprite)theme.BrandLogo=sprite;
            }
            EditorUtility.SetDirty(theme); AssetDatabase.SaveAssets(); return theme;
        }
        public static ApiConfiguration Api()
        {
            var path=FoundationPaths.Root+"/Configuration/DevelopmentApi.asset";
            var asset=AssetDatabase.LoadAssetAtPath<ApiConfiguration>(path);
            if(asset==null) { asset=ScriptableObject.CreateInstance<ApiConfiguration>(); AssetDatabase.CreateAsset(asset,path); }
            return asset;
        }
    }
}
