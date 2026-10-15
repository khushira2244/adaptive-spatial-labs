using System;
using UnityEngine;

namespace AdaptiveSpatialLabs.UI.DesignSystem
{
    [Serializable]
    public sealed class ColorTokens
    {
        public Color AppBackground = Hex(0x081522);
        public Color Panel = Hex(0x0D1B29);
        public Color PanelSecondary = Hex(0x152535);
        public Color Border = Hex(0x35516B);
        public Color Primary = Hex(0x0084FF);
        public Color PrimaryHover = Hex(0x289AFF);
        public Color TextPrimary = Hex(0xF4F7FC);
        public Color TextSecondary = Hex(0xA8C2DE);
        public Color TextMuted = Hex(0x819BB3);
        public Color Success = Hex(0x2AC49B);
        public Color Warning = Hex(0xE5B45B);
        public Color Error = Hex(0xF27982);
        public Color Private = Hex(0x7C91B6);
        public Color NavigationSelected = Hex(0x123D72);
        public Color Disabled = Hex(0x253649);
        private static Color Hex(int value) => new Color(((value >> 16) & 255) / 255f, ((value >> 8) & 255) / 255f, (value & 255) / 255f, 1f);
    }
}
