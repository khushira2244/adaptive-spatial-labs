using System;
using System.Threading;
using System.Threading.Tasks;
using NUnit.Framework;
using AdaptiveSpatialLabs.Core.Auth;
using AdaptiveSpatialLabs.Models.Api;
using AdaptiveSpatialLabs.Services.Session;
using AdaptiveSpatialLabs.Services.Storage;

namespace AdaptiveSpatialLabs.Tests
{
    public sealed class SessionStateTests
    {
        private static TokenDto Tokens()=>new TokenDto { AccessToken="access",RefreshToken="refresh",TokenType="Bearer",AccessExpiresAt=DateTimeOffset.UtcNow.AddMinutes(15).ToString("O"),RefreshExpiresAt=DateTimeOffset.UtcNow.AddDays(7).ToString("O") };
        [Test] public void SessionStartsUnauthenticated()
        { var state=new SessionState(); Assert.That(state.IsAuthenticated,Is.False); Assert.That(state.AccessToken,Is.Null); }
        [Test] public void SessionOwnsCopiedUserAndTokenInformation()
        { var user=new UserDto { Id="user",FullName="Name" }; var tokens=Tokens(); var state=new SessionState(); state.Establish(user,tokens); user.FullName="Changed"; tokens.AccessToken="Changed"; Assert.That(state.CurrentUser.FullName,Is.EqualTo("Name")); Assert.That(state.AccessToken,Is.EqualTo("access")); Assert.That(state.IsAuthenticated,Is.True); }
        [Test] public void ExpiredAccessTokenIsNotReturnedButRefreshSessionRemainsValid()
        { var tokens=Tokens(); tokens.AccessExpiresAt=DateTimeOffset.UtcNow.AddMinutes(-1).ToString("O"); var state=new SessionState(); state.Establish(new UserDto { Id="user" },tokens); Assert.That(state.AccessToken,Is.Null); Assert.That(state.RefreshToken,Is.EqualTo("refresh")); Assert.That(state.IsAuthenticated,Is.True); }
        [Test] public void RefreshExpiryEndsAuthentication()
        { var now=DateTimeOffset.UtcNow; var state=new SessionState(()=>now); var tokens=Tokens(); state.Establish(new UserDto { Id="user" },tokens); now=now.AddDays(8); Assert.That(state.IsAuthenticated,Is.False); Assert.That(state.RefreshToken,Is.Null); }
        [Test] public async Task ClearDropsStateAndStoredCredentials()
        { var state=new SessionState(); var store=new InMemoryTokenStore(); var service=new SessionService(state,store); await service.EstablishAsync(new UserDto { Id="user" },Tokens()); await service.ClearLocalAsync(); Assert.That(state.CurrentUser,Is.Null); Assert.That(await store.LoadAsync(),Is.Null); }
        [Test] public async Task TokenStoreReturnsCopiesAndSupportsCancellation()
        { var store=new InMemoryTokenStore(); await store.SaveAsync(Tokens()); var value=await store.LoadAsync(); value.AccessToken="Changed"; Assert.That((await store.LoadAsync()).AccessToken,Is.EqualTo("access")); var cancelled=new CancellationToken(true); Assert.ThrowsAsync<OperationCanceledException>(async()=>await store.LoadAsync(cancelled)); }
        [Test] public void InvalidSessionCannotAuthenticate()
        { var state=new SessionState(); var tokens=Tokens(); tokens.TokenType="Cookie"; Assert.Throws<ArgumentException>(()=>state.Establish(new UserDto { Id="u" },tokens)); Assert.That(state.IsAuthenticated,Is.False); }
    }
}
