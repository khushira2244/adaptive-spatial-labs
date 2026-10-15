using System;
using AdaptiveSpatialLabs.Core.Networking;
using AdaptiveSpatialLabs.Models.Api;

namespace AdaptiveSpatialLabs.Core.Auth
{
    public sealed class SessionState : IAccessTokenProvider
    {
        private TokenDto tokens;
        private UserDto user;
        private readonly Func<DateTimeOffset> clock;
        public event Action Changed;
        public SessionState(Func<DateTimeOffset> clock = null) => this.clock = clock ?? (() => DateTimeOffset.UtcNow);
        public UserDto CurrentUser => JsonCodec.Copy(user);
        public bool IsAuthenticated => user != null && tokens != null && IsFuture(tokens.RefreshExpiresAt);
        public string AccessToken => IsAuthenticated && IsFuture(tokens.AccessExpiresAt) ? tokens.AccessToken : null;
        public string RefreshToken => IsAuthenticated ? tokens.RefreshToken : null;
        public string AccessExpiresAt => tokens?.AccessExpiresAt;
        public string RefreshExpiresAt => tokens?.RefreshExpiresAt;

        public void Establish(UserDto currentUser, TokenDto issuedTokens)
        {
            if (currentUser == null || string.IsNullOrWhiteSpace(currentUser.Id) || issuedTokens == null ||
                string.IsNullOrWhiteSpace(issuedTokens.AccessToken) || string.IsNullOrWhiteSpace(issuedTokens.RefreshToken) ||
                issuedTokens.TokenType != "Bearer" || !IsFuture(issuedTokens.RefreshExpiresAt) ||
                !DateTimeOffset.TryParse(issuedTokens.AccessExpiresAt, out _))
                throw new ArgumentException("A current user and valid bearer-token session are required.");
            user = JsonCodec.Copy(currentUser); tokens = JsonCodec.Copy(issuedTokens); Changed?.Invoke();
        }
        public void Clear() { user = null; tokens = null; Changed?.Invoke(); }
        private bool IsFuture(string iso) => DateTimeOffset.TryParse(iso, out var value) && value > clock();
    }
}
