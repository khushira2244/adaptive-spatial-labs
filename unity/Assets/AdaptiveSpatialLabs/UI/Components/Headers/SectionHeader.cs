using TMPro;
using UnityEngine;

namespace AdaptiveSpatialLabs.UI.Components.Headers
{
    public sealed class SectionHeader : MonoBehaviour
    {
        [SerializeField] private TMP_Text title;
        [SerializeField] private TMP_Text subtitle;
        public void Configure(TMP_Text heading, TMP_Text secondary) { title = heading; subtitle = secondary; }
        public void SetText(string heading, string secondary) { title.text = heading; subtitle.text = secondary; }
    }
}
