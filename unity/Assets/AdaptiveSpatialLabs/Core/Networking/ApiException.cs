using System;
using AdaptiveSpatialLabs.Models.Api;

namespace AdaptiveSpatialLabs.Core.Networking
{
    public sealed class ApiException : Exception
    {
        public long StatusCode { get; }
        public ApiError Error { get; }
        public ApiException(long statusCode, ApiError error) : base(error.Message)
        { StatusCode = statusCode; Error = error; }
        public static ApiException Local(string code, string message) =>
            new ApiException(0, new ApiError { Code = code, Message = message, Details = null });
    }
}
