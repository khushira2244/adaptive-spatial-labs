namespace AdaptiveSpatialLabs.Models.Api
{
    public sealed class SignUpRequest
    {
        public string FullName { get; set; }
        public string WorkEmail { get; set; }
        public string Password { get; set; }
        public string Designation { get; set; }
        public string TeamDepartment { get; set; }
        public string OrganizationName { get; set; }
    }
    public sealed class LoginRequest { public string WorkEmail { get; set; } public string Password { get; set; } }
    public sealed class RefreshRequest { public string RefreshToken { get; set; } }
    public sealed class LogoutRequest { public string RefreshToken { get; set; } }
    public sealed class LogoutResponse { public bool LoggedOut { get; set; } }
    // These are the bodies inside the backend's data envelope, not invented top-level responses.
    public sealed class SignUpResponse
    {
        public UserDto User { get; set; }
        public OrganizationDto Organization { get; set; }
        public TokenDto Tokens { get; set; }
    }
    public sealed class LoginResponse { public UserDto User { get; set; } public TokenDto Tokens { get; set; } }
    public class TokenDto
    {
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }
        public string TokenType { get; set; }
        public string AccessExpiresAt { get; set; }
        public string RefreshExpiresAt { get; set; }
    }
    public sealed class RefreshResponse : TokenDto { }
}
