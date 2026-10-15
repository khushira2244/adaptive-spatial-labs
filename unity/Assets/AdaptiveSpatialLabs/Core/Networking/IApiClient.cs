using System.Threading;
using System.Threading.Tasks;
using AdaptiveSpatialLabs.Models.Api;

namespace AdaptiveSpatialLabs.Core.Networking
{
    public interface IApiClient
    {
        Task<ApiResponse<T>> GetAsync<T>(string path, CancellationToken cancellation = default, bool authenticated = true);
        Task<ApiResponse<T>> PostAsync<T>(string path, object body, CancellationToken cancellation = default, bool authenticated = true);
        Task<ApiResponse<T>> PatchAsync<T>(string path, object body, CancellationToken cancellation = default, bool authenticated = true);
        Task<ApiResponse<T>> PutAsync<T>(string path, object body, CancellationToken cancellation = default, bool authenticated = true);
        Task<ApiResponse<T>> DeleteAsync<T>(string path, CancellationToken cancellation = default, bool authenticated = true);
    }
}
