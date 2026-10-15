using System;

namespace AdaptiveSpatialLabs.Core.Configuration
{
    public sealed class ApiClientOptions
    {
        public Uri BaseUrl { get; }
        public int TimeoutSeconds { get; }
        public ApiClientOptions(string baseUrl, int timeoutSeconds = 20, bool allowDevelopmentHttp = false)
        {
            if (!Uri.TryCreate(baseUrl, UriKind.Absolute, out var uri) ||
                (uri.Scheme != "https" && !(allowDevelopmentHttp && uri.Scheme == "http")) ||
                !string.IsNullOrEmpty(uri.Query) || !string.IsNullOrEmpty(uri.Fragment) || !string.IsNullOrEmpty(uri.UserInfo))
                throw new ArgumentException("Provide an HTTPS API base URL; HTTP is allowed only with explicit development configuration.", nameof(baseUrl));
            if (timeoutSeconds < 1 || timeoutSeconds > 120) throw new ArgumentOutOfRangeException(nameof(timeoutSeconds));
            BaseUrl = new Uri(baseUrl.TrimEnd('/') + "/"); TimeoutSeconds = timeoutSeconds;
        }
    }
}
