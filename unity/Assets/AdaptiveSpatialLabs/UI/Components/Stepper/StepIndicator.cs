using TMPro;
using UnityEngine;
using AdaptiveSpatialLabs.UI.Components.Panels;
using AdaptiveSpatialLabs.UI.DesignSystem;

namespace AdaptiveSpatialLabs.UI.Components.Stepper
{
    public sealed class StepIndicator : MonoBehaviour
    {
        [SerializeField] private RoundedPanel circle;
        [SerializeField] private TMP_Text number;
        [SerializeField] private TMP_Text label;
        [SerializeField] private DesignTheme theme;
        public void Configure(RoundedPanel disk,TMP_Text digit,TMP_Text caption,DesignTheme tokens)
        { circle=disk; number=digit; label=caption; theme=tokens; }
        public void SetCurrent(bool active)
        { circle.Style(active?theme.Colors.Primary:theme.Colors.Panel,active?theme.Colors.TextPrimary:theme.Colors.Border,100,theme.Spacing.BorderThickness); number.color=label.color=active?theme.Colors.TextPrimary:theme.Colors.TextSecondary; }
    }
}
