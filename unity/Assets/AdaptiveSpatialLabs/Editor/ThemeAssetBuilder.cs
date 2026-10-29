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
        private const string FontPath="Assets/TextMesh Pro/Resources/Fonts & Materials/LiberationSans SDF.asset";
        private const string EssentialsName="TMP Essential Resources";
        private static bool importingEssentials;

        // ImportPackage is asynchronous. Never create theme/prefab assets against a pending font.
        // Deliberately require a fresh menu invocation after import/domain reload, not a delayed
        // scene replacement that could discard work the user started while import was running.
        public static bool EnsureEssentialResources()
        {
            if(importingEssentials || EditorApplication.isCompiling || EditorApplication.isUpdating)
            {
                Debug.Log("ASL foundation paused while Unity imports/compiles assets. Run Build Task 1 Foundation when Unity is idle.");
                return false;
            }
            if(AssetDatabase.LoadAssetAtPath<TMP_FontAsset>(FontPath)!=null)return true;
            if(File.Exists(FontPath))
            {
                AssetDatabase.ImportAsset(FontPath,ImportAssetOptions.ForceSynchronousImport);
                if(AssetDatabase.LoadAssetAtPath<TMP_FontAsset>(FontPath)!=null)return true;
                Debug.LogWarning("ASL foundation paused: the existing TMP essential font is not loadable. Check Unity import/compile errors before rerunning; existing resources were not overwritten.");
                return false;
            }
            var package=UnityEditor.PackageManager.PackageInfo.FindForAssembly(typeof(TMP_Text).Assembly);
            var archive=package==null ? null : Path.Combine(package.resolvedPath,"Package Resources/"+EssentialsName+".unitypackage");
            if(archive==null || !File.Exists(archive))
            {
                Debug.LogError("TMP Essentials archive is unavailable in the installed TMP/uGUI package. Resolve the package before building the foundation.");
                return false;
            }
            importingEssentials=true;
            AssetDatabase.importPackageCompleted+=EssentialsImported;
            AssetDatabase.importPackageCancelled+=EssentialsCancelled;
            AssetDatabase.importPackageFailed+=EssentialsFailed;
            Debug.Log("Importing official TMP Essentials. Once Unity finishes importing/compiling, run Adaptive Spatial Labs > Build Task 1 Foundation again.");
            try { AssetDatabase.ImportPackage(archive,false); }
            catch { ClearImportHandlers(); throw; }
            return false;
        }
        private static bool IsEssentials(string packageName)=>Path.GetFileNameWithoutExtension(packageName)==EssentialsName;
        private static void EssentialsImported(string packageName)
        {
            if(!IsEssentials(packageName))return;
            ClearImportHandlers();
            Debug.Log("TMP Essentials import completed. After Unity finishes refreshing/compiling, run Build Task 1 Foundation again.");
        }
        private static void EssentialsCancelled(string packageName)
        {
            if(!IsEssentials(packageName))return;
            ClearImportHandlers();
            Debug.LogWarning("TMP Essentials import cancelled. Run Build Task 1 Foundation again to retry.");
        }
        private static void EssentialsFailed(string packageName,string error)
        {
            if(!IsEssentials(packageName))return;
            ClearImportHandlers();
            Debug.LogError("TMP Essentials import failed: "+error+". Resolve the import error, then rerun Build Task 1 Foundation.");
        }
        private static void ClearImportHandlers()
        {
            importingEssentials=false;
            AssetDatabase.importPackageCompleted-=EssentialsImported;
            AssetDatabase.importPackageCancelled-=EssentialsCancelled;
            AssetDatabase.importPackageFailed-=EssentialsFailed;
        }
        public static DesignTheme Build()
        {
            var font=AssetDatabase.LoadAssetAtPath<TMP_FontAsset>(FontPath);
            if(font==null)throw new System.InvalidOperationException("Check TMP Essentials readiness before building theme assets.");
            Directory.CreateDirectory(FoundationPaths.Root+"/Configuration"); AssetDatabase.Refresh();
            var theme=AssetDatabase.LoadAssetAtPath<DesignTheme>(FoundationPaths.Theme);
            if(theme==null) { theme=ScriptableObject.CreateInstance<DesignTheme>(); AssetDatabase.CreateAsset(theme,FoundationPaths.Theme); }
            theme.Font=font;
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
