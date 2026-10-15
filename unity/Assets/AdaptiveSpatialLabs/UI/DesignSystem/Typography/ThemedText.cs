using TMPro;
using UnityEngine;

namespace AdaptiveSpatialLabs.UI.DesignSystem
{
    [RequireComponent(typeof(TMP_Text))]
    public sealed class ThemedText : MonoBehaviour
    {
        [SerializeField] private DesignTheme theme;
        [SerializeField] private TextStyle style;
        [SerializeField] private bool secondary;
        public void Configure(DesignTheme tokens,TextStyle role,bool subdued=false)
        { theme=tokens; style=role; secondary=subdued; Apply(); }
        private void OnEnable() { if(theme!=null)Apply(); }
        public void Apply()
        {
            var text=GetComponent<TMP_Text>(); text.font=theme.Font;
            text.fontSize=theme.Typography.Size(style);
            text.color=secondary?theme.Colors.TextSecondary:theme.Colors.TextPrimary;
            text.fontStyle=style==TextStyle.PageTitle||style==TextStyle.SectionTitle||style==TextStyle.CardTitle?FontStyles.Bold:FontStyles.Normal;
        }
    }
}
