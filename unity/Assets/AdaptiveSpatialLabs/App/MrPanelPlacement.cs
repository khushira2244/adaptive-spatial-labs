using UnityEngine;
using AdaptiveSpatialLabs.UI.DesignSystem;

namespace AdaptiveSpatialLabs.App
{
    public sealed class MrPanelPlacement : MonoBehaviour
    {
        [SerializeField] private DesignTheme theme;
        [SerializeField] private Camera viewer;
        [SerializeField] private RectTransform canvas;
        public void Configure(DesignTheme tokens,Camera camera,RectTransform root)
        { theme=tokens; viewer=camera; canvas=root; }
        private void Start()=>Recenter();
        public void Recenter()
        {
            canvas.sizeDelta=theme.Dimensions.PanelUnits;
            canvas.localScale=Vector3.one*theme.Dimensions.CanvasScale;
            var forward=Vector3.ProjectOnPlane(viewer.transform.forward,Vector3.up).normalized;
            if(forward.sqrMagnitude<0.1f)forward=Vector3.forward;
            canvas.position=viewer.transform.position+forward*theme.Dimensions.ViewingDistanceMeters;
            canvas.rotation=Quaternion.LookRotation(forward,Vector3.up);
        }
        // Fixed world-space placement after recenter; never continuously follows head movement.
    }
}
