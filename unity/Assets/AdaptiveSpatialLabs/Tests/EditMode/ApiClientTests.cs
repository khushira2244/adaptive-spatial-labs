using System;
using System.Threading;
using System.Threading.Tasks;
using NUnit.Framework;
using AdaptiveSpatialLabs.Core.Auth;
using AdaptiveSpatialLabs.Core.Configuration;
using AdaptiveSpatialLabs.Core.Networking;
using AdaptiveSpatialLabs.Models.Api;
using AdaptiveSpatialLabs.Services.Api;

namespace AdaptiveSpatialLabs.Tests
{
    public sealed class ApiClientTests
    {
        private sealed class TokenProvider : IAccessTokenProvider { public string AccessToken { get; set; }="access"; }
        private sealed class FakeTransport : IHttpTransport
        {
            public HttpRequest Last;
            public HttpResponse Response=new HttpResponse(200,"{\"data\":{\"id\":\"u\",\"fullName\":\"User\"}}");
            public Task<HttpResponse> SendAsync(HttpRequest request,CancellationToken cancellation)
            { cancellation.ThrowIfCancellationRequested(); Last=request; return Task.FromResult(Response); }
        }
        private static ApiClient Client(FakeTransport transport,TokenProvider token=null)=>new ApiClient(new ApiClientOptions("https://example.com/api/v1",12),transport,token??new TokenProvider());
        [Test] public async Task DeserializesEnvelopeAndAddsBearerHeader()
        { var transport=new FakeTransport(); var res=await Client(transport).GetAsync<UserDto>("me"); Assert.That(res.Data.Id,Is.EqualTo("u")); Assert.That(transport.Last.Headers["Authorization"],Is.EqualTo("Bearer access")); Assert.That(transport.Last.Url.AbsoluteUri,Is.EqualTo("https://example.com/api/v1/me")); Assert.That(transport.Last.TimeoutSeconds,Is.EqualTo(12)); }
        [Test] public async Task PublicRequestNeverSendsBearerCredential()
        { var transport=new FakeTransport(); await Client(transport).PostAsync<UserDto>("auth/login",new LoginRequest { WorkEmail="name@example.com",Password="password" },authenticated:false); Assert.That(transport.Last.Headers.ContainsKey("Authorization"),Is.False); Assert.That(transport.Last.Json,Does.Contain("\"workEmail\"")); }
        [TestCase("GET")] [TestCase("POST")] [TestCase("PATCH")] [TestCase("PUT")] [TestCase("DELETE")]
        public async Task SupportsAllRequiredHttpMethods(string method)
        {
            var transport=new FakeTransport(); var client=Client(transport);
            switch(method) { case "GET":await client.GetAsync<UserDto>("me"); break; case "POST":await client.PostAsync<UserDto>("me",new{}); break; case "PATCH":await client.PatchAsync<UserDto>("me",new{}); break; case "PUT":await client.PutAsync<UserDto>("me",new{}); break; default:await client.DeleteAsync<UserDto>("me"); break; }
            Assert.That(transport.Last.Method,Is.EqualTo(method));
        }
        [Test] public void StructuredBackendErrorIsPreserved()
        { var transport=new FakeTransport { Response=new HttpResponse(403,"{\"error\":{\"code\":\"PROJECT_FORBIDDEN\",\"message\":\"You do not have access to this project.\",\"details\":null}}") }; var error=Assert.ThrowsAsync<ApiException>(async()=>await Client(transport).GetAsync<UserDto>("projects/project")); Assert.That(error.Error.Code,Is.EqualTo("PROJECT_FORBIDDEN")); Assert.That(error.StatusCode,Is.EqualTo(403)); }
        [Test] public void MalformedHttpErrorDoesNotExposeRawResponse()
        { var transport=new FakeTransport { Response=new HttpResponse(500,"SQL secret stack trace") }; var error=Assert.ThrowsAsync<ApiException>(async()=>await Client(transport).GetAsync<UserDto>("me")); Assert.That(error.Message,Does.Not.Contain("SQL")); Assert.That(error.Error.Code,Is.EqualTo("HTTP_ERROR")); }
        [Test] public void MissingDataEnvelopeIsNotSuccess()
        { var transport=new FakeTransport { Response=new HttpResponse(200,"{\"id\":\"u\"}") }; Assert.That(Assert.ThrowsAsync<ApiException>(async()=>await Client(transport).GetAsync<UserDto>("me")).Error.Code,Is.EqualTo("INVALID_RESPONSE")); }
        [Test] public void CancellationStopsBeforeTransport()
        { var transport=new FakeTransport(); Assert.ThrowsAsync<OperationCanceledException>(async()=>await Client(transport).GetAsync<UserDto>("me",new CancellationToken(true))); Assert.That(transport.Last,Is.Null); }
        [Test] public void MissingSessionFailsLocallyWithoutRequest()
        { var transport=new FakeTransport(); Assert.That(Assert.ThrowsAsync<ApiException>(async()=>await Client(transport,new TokenProvider { AccessToken=null }).GetAsync<UserDto>("me")).Error.Code,Is.EqualTo("AUTH_UNAUTHORIZED")); Assert.That(transport.Last,Is.Null); }
        [TestCase("https://other.example/me")] [TestCase("../secret")] [TestCase("/me")] [TestCase("//other.example/me")]
        public void CannotForwardTokensToForeignOrEscapedUrls(string path)
        { var transport=new FakeTransport(); Assert.ThrowsAsync<ArgumentException>(async()=>await Client(transport).GetAsync<UserDto>(path)); Assert.That(transport.Last,Is.Null); }
        [Test] public void PlainHttpRequiresExplicitDevelopmentPermission()
        { Assert.Throws<ArgumentException>(()=>new ApiClientOptions("http://localhost/api/v1")); Assert.DoesNotThrow(()=>new ApiClientOptions("http://localhost/api/v1",allowDevelopmentHttp:true)); }
        [Test] public void TransportFailuresHaveSafeErrors()
        { var transport=new FakeTransport { Response=new HttpResponse(0,"private connection details",true) }; Assert.That(Assert.ThrowsAsync<ApiException>(async()=>await Client(transport).GetAsync<UserDto>("me")).Error.Code,Is.EqualTo("NETWORK_ERROR")); }
    }
}
