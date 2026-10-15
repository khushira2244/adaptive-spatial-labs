using System;
using UnityEngine;

namespace AdaptiveSpatialLabs.UI.DesignSystem
{
    public enum TextStyle { PageTitle, SectionTitle, CardTitle, Body, SecondaryBody, Metadata, ButtonLabel, InputLabel, InputText }
    [Serializable]
    public sealed class TypographyTokens
    {
        public float PageTitle = 36, SectionTitle = 26, CardTitle = 23, Body = 21,
            SecondaryBody = 19, Metadata = 17, ButtonLabel = 21, InputLabel = 19, InputText = 20;
        public float Size(TextStyle style)
        {
            switch (style)
            {
                case TextStyle.PageTitle: return PageTitle;
                case TextStyle.SectionTitle: return SectionTitle;
                case TextStyle.CardTitle: return CardTitle;
                case TextStyle.SecondaryBody: return SecondaryBody;
                case TextStyle.Metadata: return Metadata;
                case TextStyle.ButtonLabel: return ButtonLabel;
                case TextStyle.InputLabel: return InputLabel;
                case TextStyle.InputText: return InputText;
                default: return Body;
            }
        }
    }
}
