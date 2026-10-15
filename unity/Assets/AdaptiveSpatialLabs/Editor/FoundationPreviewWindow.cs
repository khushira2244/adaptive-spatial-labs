using UnityEditor;
using UnityEngine;
using AdaptiveSpatialLabs.App;
using AdaptiveSpatialLabs.Core.Navigation;

namespace AdaptiveSpatialLabs.Editor
{
    public sealed class FoundationPreviewWindow : EditorWindow
    {
        [SerializeField] private AppCompositionRoot application;
        [SerializeField] private ScreenRoute route=ScreenRoute.Home;
        [MenuItem("Adaptive Spatial Labs/Task 1 Route Preview")]
        public static void Open()=>GetWindow<FoundationPreviewWindow>("ASL Route Preview");
        private void OnGUI()
        {
            EditorGUILayout.HelpBox("Task 1 preview only. Assign the scene's ApplicationComposition object. This does not sign in or create a project.",MessageType.Info);
            application=(AppCompositionRoot)EditorGUILayout.ObjectField("Application",application,typeof(AppCompositionRoot),true);
            route=(ScreenRoute)EditorGUILayout.EnumPopup("Route",route);
            using(new EditorGUI.DisabledScope(application==null))
            {
                if(GUILayout.Button("Show placeholder")) { application.Initialize(); application.Navigation.Navigate(route); }
                if(GUILayout.Button("Back")) { application.Initialize(); application.Navigation.Back(); }
            }
        }
    }
}
