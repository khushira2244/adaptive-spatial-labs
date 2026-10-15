using TMPro;
using UnityEngine;
using AdaptiveSpatialLabs.UI.Components.Panels;

namespace AdaptiveSpatialLabs.UI.Components.Badges
{
    public sealed class StatusBadge : MonoBehaviour
    {
        [SerializeField] private TMP_Text label;
        [SerializeField] private RoundedPanel panel;
        public void Configure(TMP_Text text, RoundedPanel background) { label = text; panel = background; }
        public void SetStatus(string text, Color tint)
        { label.text = text; label.color = tint; panel.color = new Color(tint.r, tint.g, tint.b, 0.14f); }
    }
}
