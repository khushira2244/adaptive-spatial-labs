using TMPro;
using UnityEngine;

namespace AdaptiveSpatialLabs.UI.DesignSystem
{
    [CreateAssetMenu(menuName = "Adaptive Spatial Labs/Design Theme")]
    public sealed class DesignTheme : ScriptableObject
    {
        public ColorTokens Colors = new ColorTokens();
        public TypographyTokens Typography = new TypographyTokens();
        public SpacingTokens Spacing = new SpacingTokens();
        public MrDimensions Dimensions = new MrDimensions();
        public TMP_FontAsset Font;
        public Sprite BrandLogo;
    }
}
