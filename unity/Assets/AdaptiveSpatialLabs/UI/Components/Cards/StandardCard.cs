using TMPro;
using UnityEngine;

namespace AdaptiveSpatialLabs.UI.Components.Cards
{
    public class StandardCard : MonoBehaviour
    {
        [SerializeField] private TMP_Text title;
        [SerializeField] private RectTransform content;
        public RectTransform Content => content;
        public void Configure(TMP_Text text, RectTransform region) { title = text; content = region; }
        public void SetTitle(string value) => title.text = value;
    }
}
