using System;
using System.Threading;
using System.Threading.Tasks;
using AdaptiveSpatialLabs.Core.Auth;
using AdaptiveSpatialLabs.Models.Api;

namespace AdaptiveSpatialLabs.Services.Session
{
    // Foundation only. No login/refresh/logout API workflow is wired to UI in Task 1.
    public sealed class SessionService
    {
        private readonly ITokenStore store;
        public SessionState State { get; }
        public SessionService(SessionState state, ITokenStore store)
        { State = state ?? throw new ArgumentNullException(nameof(state)); this.store = store ?? throw new ArgumentNullException(nameof(store)); }

        public async Task EstablishAsync(UserDto user, TokenDto tokens, CancellationToken cancellation = default)
        {
            // Validate before writing; a failed store must not establish an apparently authenticated session.
            var validated = new SessionState(); validated.Establish(user, tokens);
            await store.SaveAsync(tokens, cancellation); State.Establish(user, tokens);
        }
        public async Task ClearLocalAsync(CancellationToken cancellation = default)
        { await store.ClearAsync(cancellation); State.Clear(); }
    }
}
