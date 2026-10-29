using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.XR.Management;
using UnityEditor.XR.Management.Metadata;
using UnityEditor.XR.OpenXR.Features;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.XR.Management;
using UnityEngine.XR.OpenXR;
using UnityEngine.XR.OpenXR.Features.Interactions;
using UnityEngine.XR.OpenXR.Features.Meta;


namespace AdaptiveSpatialLabs.Editor
{
    public static class QuestProjectSetup
    {
        [MenuItem("Adaptive Spatial Labs/Configure Quest OpenXR")]
        public static void Apply()
        {
            Directory.CreateDirectory(FoundationPaths.Root+"/Configuration"); AssetDatabase.Refresh();
            PlayerSettings.companyName="Adaptive Spatial Labs";
            PlayerSettings.productName="Adaptive Spatial Labs";
            PlayerSettings.SetApplicationIdentifier(NamedBuildTarget.Android,"com.adaptivespatiallabs.quest");
            PlayerSettings.SetScriptingBackend(NamedBuildTarget.Android,ScriptingImplementation.IL2CPP);
            PlayerSettings.Android.targetArchitectures=AndroidArchitecture.ARM64;
            PlayerSettings.Android.minSdkVersion=AndroidSdkVersions.AndroidApiLevel32;
            PlayerSettings.Android.targetSdkVersion=AndroidSdkVersions.AndroidApiLevelAuto;
            PlayerSettings.SetUseDefaultGraphicsAPIs(BuildTarget.Android,false);
            PlayerSettings.SetGraphicsAPIs(BuildTarget.Android,new[] { GraphicsDeviceType.Vulkan });
            PlayerSettings.colorSpace=ColorSpace.Linear;
            PlayerSettings.defaultInterfaceOrientation=UIOrientation.LandscapeLeft;
            PlayerSettings.insecureHttpOption=InsecureHttpOption.DevelopmentOnly;
            var player=new SerializedObject(AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/ProjectSettings.asset")[0]);
            var input=player.FindProperty("activeInputHandler"); if(input!=null)input.intValue=1; player.ApplyModifiedPropertiesWithoutUndo();
            if(BuildPipeline.IsBuildTargetSupported(BuildTargetGroup.Android,BuildTarget.Android))
                ConfigureLoader(BuildTargetGroup.Android,true);
            else
                Debug.LogWarning("Android Build Support is absent. Baseline Android settings were saved; install that module and re-run Configure Quest OpenXR to create Android loader/features.");
            // A desktop preview does not start an OpenXR runtime. Quest Link can be explicitly enabled later.
            ConfigureLoader(BuildTargetGroup.Standalone,false);
            AssetDatabase.SaveAssets();
            Debug.Log("ASL Quest configuration saved. Android build support and a physical Quest are still needed for APK/device validation.");
        }
        private static void ConfigureLoader(BuildTargetGroup target,bool autoStart)
        {
            if(!EditorBuildSettings.TryGetConfigObject(XRGeneralSettings.settingsKey,out XRGeneralSettingsPerBuildTarget store))
            {
                store=ScriptableObject.CreateInstance<XRGeneralSettingsPerBuildTarget>();
                AssetDatabase.CreateAsset(store,FoundationPaths.Root+"/Configuration/XRGeneralSettings.asset");
                EditorBuildSettings.AddConfigObject(XRGeneralSettings.settingsKey,store,true);
            }
            if(!store.HasSettingsForBuildTarget(target))store.CreateDefaultSettingsForBuildTarget(target);
            var general=store.SettingsForBuildTarget(target);
            if(general.Manager==null)
            {
                general.Manager=ScriptableObject.CreateInstance<XRManagerSettings>(); general.Manager.name=target+" XR Manager";
                AssetDatabase.AddObjectToAsset(general.Manager,store);
            }
            general.InitManagerOnStart=autoStart; general.Manager.automaticLoading=true; general.Manager.automaticRunning=true;
            if(!XRPackageMetadataStore.AssignLoader(general.Manager,"UnityEngine.XR.OpenXR.OpenXRLoader",target))
                throw new InvalidOperationException("OpenXR loader assignment failed for "+target);
            FeatureHelpers.RefreshFeatures(target);
            var settings=OpenXRSettings.GetSettingsForBuildTargetGroup(target);
            if(settings==null)throw new InvalidOperationException("OpenXR settings are unavailable for "+target);
            settings.renderMode=OpenXRSettings.RenderMode.SinglePassInstanced;
            Enable<OculusTouchControllerProfile>(settings);
            if(target==BuildTargetGroup.Android) {  Enable<ARCameraFeature>(settings); }
            EditorUtility.SetDirty(settings); EditorUtility.SetDirty(general); EditorUtility.SetDirty(general.Manager); EditorUtility.SetDirty(store);
        }
        private static void Enable<T>(OpenXRSettings settings) where T:UnityEngine.XR.OpenXR.Features.OpenXRFeature
        {
            var feature=settings.GetFeature<T>();
            if(feature==null)throw new InvalidOperationException("Required OpenXR feature unavailable: "+typeof(T).Name);
            feature.enabled=true; EditorUtility.SetDirty(feature);
        }
    }
}
