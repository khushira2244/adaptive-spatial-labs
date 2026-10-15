using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Newtonsoft.Json;
using AdaptiveSpatialLabs.Core.Auth;
using AdaptiveSpatialLabs.Core.Configuration;
using AdaptiveSpatialLabs.Core.Networking;
using AdaptiveSpatialLabs.Models.Api;

namespace AdaptiveSpatialLabs.Services.Api
{
    public sealed class ApiClient : IApiClient
    {
        private readonly ApiClientOptions options;
        private readonly IHttpTransport transport;
        private readonly IAccessTokenProvider session;
        public ApiClient(ApiClientOptions options, IHttpTransport transport, IAccessTokenProvider session)
        { this.options = options; this.transport = transport; this.session = session; }

        public Task<ApiResponse<T>> GetAsync<T>(string path, CancellationToken cancellation = default, bool authenticated = true) => Send<T>("GET", path, null, cancellation, authenticated);
        public Task<ApiResponse<T>> PostAsync<T>(string path, object body, CancellationToken cancellation = default, bool authenticated = true) => Send<T>("POST", path, body, cancellation, authenticated);
        public Task<ApiResponse<T>> PatchAsync<T>(string path, object body, CancellationToken cancellation = default, bool authenticated = true) => Send<T>("PATCH", path, body, cancellation, authenticated);
        public Task<ApiResponse<T>> PutAsync<T>(string path, object body, CancellationToken cancellation = default, bool authenticated = true) => Send<T>("PUT", path, body, cancellation, authenticated);
        public Task<ApiResponse<T>> DeleteAsync<T>(string path, CancellationToken cancellation = default, bool authenticated = true) => Send<T>("DELETE", path, null, cancellation, authenticated);

        private async Task<ApiResponse<T>> Send<T>(string method, string path, object body, CancellationToken cancellation, bool authenticated)
        {
            cancellation.ThrowIfCancellationRequested();
            if (string.IsNullOrWhiteSpace(path) || path.StartsWith("/") || path.Contains("\\") ||
                path.Contains("#") || Uri.TryCreate(path, UriKind.Absolute, out _))
                throw new ArgumentException("Use a relative API route without a leading slash.", nameof(path));
            var url = new Uri(options.BaseUrl, path);
            if (!url.AbsoluteUri.StartsWith(options.BaseUrl.AbsoluteUri, StringComparison.Ordinal))
                throw new ArgumentException("Route must stay under the API base URL.", nameof(path));
            var headers = new Dictionary<string, string> { ["Accept"] = "application/json" };
            if (authenticated)
            {
                var token = session.AccessToken;
                if (string.IsNullOrWhiteSpace(token)) throw ApiException.Local("AUTH_UNAUTHORIZED", "Sign in is required.");
                headers["Authorization"] = "Bearer " + token;
            }
            if (body != null) headers["Content-Type"] = "application/json";
            var response = await transport.SendAsync(new HttpRequest(method, url, body == null ? null : JsonCodec.Serialize(body), headers, options.TimeoutSeconds), cancellation);
            if (response.TransportFailed) throw ApiException.Local("NETWORK_ERROR", "The server could not be reached. Please try again.");
            if (response.StatusCode < 200 || response.StatusCode >= 300) throw Error(response);
            try
            {
                // Explicit data envelope is mandatory; a default DTO must not masquerade as success.
                var envelope = Newtonsoft.Json.Linq.JObject.Parse(response.Body);
                if (!envelope.ContainsKey("data")) throw new JsonException("Missing data envelope");
                return JsonCodec.Deserialize<ApiResponse<T>>(response.Body);
            }
            catch (JsonException) { throw ApiException.Local("INVALID_RESPONSE", "The server returned an unexpected response."); }
        }

        private static ApiException Error(HttpResponse response)
        {
            try
            {
                var error = JsonCodec.Deserialize<ApiErrorResponse>(response.Body)?.Error;
                if (error != null && !string.IsNullOrWhiteSpace(error.Code) && !string.IsNullOrWhiteSpace(error.Message))
                    return new ApiException(response.StatusCode, error);
            }
            catch (JsonException) { }
            return new ApiException(response.StatusCode, new ApiError { Code = "HTTP_ERROR", Message = "The request could not be completed.", Details = null });
        }
    }
}
