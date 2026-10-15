using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace AdaptiveSpatialLabs.Core.Networking
{
    public sealed class HttpRequest
    {
        public string Method { get; }
        public Uri Url { get; }
        public string Json { get; }
        public IReadOnlyDictionary<string, string> Headers { get; }
        public int TimeoutSeconds { get; }
        public HttpRequest(string method, Uri url, string json, IReadOnlyDictionary<string, string> headers, int timeoutSeconds)
        { Method = method; Url = url; Json = json; Headers = headers; TimeoutSeconds = timeoutSeconds; }
    }
    public sealed class HttpResponse
    {
        public long StatusCode { get; }
        public string Body { get; }
        public bool TransportFailed { get; }
        public HttpResponse(long statusCode, string body, bool transportFailed = false)
        { StatusCode = statusCode; Body = body; TransportFailed = transportFailed; }
    }
    public interface IHttpTransport
    {
        Task<HttpResponse> SendAsync(HttpRequest request, CancellationToken cancellation);
    }
}
