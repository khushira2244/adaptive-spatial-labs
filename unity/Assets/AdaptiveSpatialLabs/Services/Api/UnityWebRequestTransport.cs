using System.Text;
using System.Threading;
using System.Threading.Tasks;
using UnityEngine.Networking;
using AdaptiveSpatialLabs.Core.Networking;

namespace AdaptiveSpatialLabs.Services.Api
{
    public sealed class UnityWebRequestTransport : IHttpTransport
    {
        // Call from Unity's main thread; awaits preserve its synchronization context.
        public async Task<HttpResponse> SendAsync(HttpRequest input, CancellationToken cancellation)
        {
            cancellation.ThrowIfCancellationRequested();
            using (var request = new UnityWebRequest(input.Url, input.Method))
            {
                request.timeout = input.TimeoutSeconds;
                request.redirectLimit = 0; // Never forward credentials to a redirect destination.
                request.downloadHandler = new DownloadHandlerBuffer();
                if (input.Json != null) request.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(input.Json));
                foreach (var header in input.Headers) request.SetRequestHeader(header.Key, header.Value);
                var operation = request.SendWebRequest();
                while (!operation.isDone)
                {
                    if (cancellation.IsCancellationRequested) { request.Abort(); cancellation.ThrowIfCancellationRequested(); }
                    await Task.Yield();
                }
                cancellation.ThrowIfCancellationRequested();
                return new HttpResponse(request.responseCode, request.downloadHandler.text,
                    request.result == UnityWebRequest.Result.ConnectionError || request.result == UnityWebRequest.Result.DataProcessingError);
            }
        }
    }
}
