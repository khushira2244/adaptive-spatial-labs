using UnityEngine;

namespace AdaptiveSpatialLabs.Core.Configuration
{
    [CreateAssetMenu(menuName = "Adaptive Spatial Labs/API Configuration")]
    public sealed class ApiConfiguration : ScriptableObject
    {
        [SerializeField] private string baseUrl = "http://127.0.0.1:3000/api/v1/";
        [SerializeField, Range(1, 120)] private int timeoutSeconds = 20;
        [SerializeField] private bool allowDevelopmentHttp = true;
        public ApiClientOptions CreateOptions() => new ApiClientOptions(baseUrl, timeoutSeconds,
            allowDevelopmentHttp && (Application.isEditor || Debug.isDebugBuild));
    }
}
