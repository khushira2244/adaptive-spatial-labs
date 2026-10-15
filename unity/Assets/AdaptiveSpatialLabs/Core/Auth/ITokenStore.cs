using System.Threading;
using System.Threading.Tasks;
using AdaptiveSpatialLabs.Models.Api;

namespace AdaptiveSpatialLabs.Core.Auth
{
    public interface ITokenStore
    {
        Task<TokenDto> LoadAsync(CancellationToken cancellation = default);
        Task SaveAsync(TokenDto tokens, CancellationToken cancellation = default);
        Task ClearAsync(CancellationToken cancellation = default);
    }
    public interface IAccessTokenProvider { string AccessToken { get; } }
}
