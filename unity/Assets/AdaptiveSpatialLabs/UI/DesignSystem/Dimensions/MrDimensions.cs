using System;
using UnityEngine;

namespace AdaptiveSpatialLabs.UI.DesignSystem
{
    [Serializable]
    public sealed class MrDimensions
    {
        [Range(1.15f, 1.2f)] public float MainPanelWidthMeters = 1.18f;
        [Range(0.68f, 0.72f)] public float MainPanelHeightMeters = 0.70f;
        [Range(1f, 1.2f)] public float ViewingDistanceMeters = 1.10f;
        [Range(0.18f, 0.22f)] public float SidebarWidthMeters = 0.20f;
        [Range(0.08f, 0.10f)] public float TopBarHeightMeters = 0.09f;
        public float StandardButtonHeightMeters = 0.052f;
        public float StandardInputHeightMeters = 0.054f;
        public float MinimumTargetMeters = 0.048f;
        public float UnitsPerMeter = 1000f;
        public Vector2 PanelUnits => new Vector2(MainPanelWidthMeters, MainPanelHeightMeters) * UnitsPerMeter;
        public float CanvasScale => 1f / UnitsPerMeter;
        public float ButtonUnits => Mathf.Max(StandardButtonHeightMeters, MinimumTargetMeters) * UnitsPerMeter;
        public float InputUnits => Mathf.Max(StandardInputHeightMeters, MinimumTargetMeters) * UnitsPerMeter;
        public float SidebarUnits => SidebarWidthMeters * UnitsPerMeter;
        public float TopBarUnits => TopBarHeightMeters * UnitsPerMeter;
        public float TargetUnits => MinimumTargetMeters * UnitsPerMeter;
    }
}
