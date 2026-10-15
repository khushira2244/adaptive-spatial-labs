using UnityEngine;

namespace AdaptiveSpatialLabs.UI.Components.Stepper
{
    public sealed class Stepper : MonoBehaviour
    {
        [SerializeField] private StepIndicator[] steps;
        public void Configure(StepIndicator[] indicators)=>steps=indicators;
        public void Select(int index) { for(var i=0;i<steps.Length;i++)steps[i].SetCurrent(i==index); }
    }
}
