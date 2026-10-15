using TMPro;
using UnityEngine;
using AdaptiveSpatialLabs.Core.Navigation;
using AdaptiveSpatialLabs.UI.Components.Stepper;

namespace AdaptiveSpatialLabs.UI.Screens
{
    public sealed class ScreenView : MonoBehaviour
    {
        [SerializeField] private ScreenRoute route;
        [SerializeField] private TMP_Text title;
        [SerializeField] private RectTransform content;
        [SerializeField] private Stepper stepper;
        public ScreenRoute Route => route;
        public RectTransform Content => content;
        public void Configure(ScreenRoute screen, TMP_Text heading, RectTransform region, Stepper stages=null)
        { route=screen; title=heading; content=region; stepper=stages; }
        public void Present(RouteDefinition definition)
        { title.text=definition.Title; if(stepper!=null)stepper.Select(definition.WizardStep); }
    }
}
