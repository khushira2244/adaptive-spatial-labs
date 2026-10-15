using Newtonsoft.Json;

namespace AdaptiveSpatialLabs.Models.Api
{
    public sealed class ApiResponse<T> { [JsonProperty("data")] public T Data { get; set; } }
    public sealed class ApiErrorResponse { [JsonProperty("error")] public ApiError Error { get; set; } }
    public sealed class ApiError
    {
        public string Code { get; set; }
        public string Message { get; set; }
        public object Details { get; set; } // Backend Group 1 always returns null.
    }
}
