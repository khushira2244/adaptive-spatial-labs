using Newtonsoft.Json;

namespace AdaptiveSpatialLabs.Models.Api
{
    public sealed class UserDto
    {
        public string Id { get; set; }
        public string FullName { get; set; }
        public string WorkEmail { get; set; }
        public string Designation { get; set; }
        public string TeamDepartment { get; set; }
        public string ProfileImage { get; set; }
        public string CreatedAt { get; set; }
        public string UpdatedAt { get; set; }
    }
    public sealed class UpdateProfileRequest
    {
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)] public string FullName { get; set; }
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)] public string Designation { get; set; }
        // ShouldSerialize permits omitted fields versus explicitly clearing nullable profile values.
        public string TeamDepartment { get; set; }
        public string ProfileImage { get; set; }
        [JsonIgnore] public bool IncludeTeamDepartment { get; set; }
        [JsonIgnore] public bool IncludeProfileImage { get; set; }
        public bool ShouldSerializeTeamDepartment() => IncludeTeamDepartment;
        public bool ShouldSerializeProfileImage() => IncludeProfileImage;
    }
    public sealed class UserPreferenceDto
    {
        public string Theme { get; set; } = "SYSTEM";
        public bool ReduceMotion { get; set; }
        public NotificationPreferences Notifications { get; set; } = new NotificationPreferences();
        public MrPreferences MrPreferences { get; set; } = new MrPreferences();
        public InteractionPreferences InteractionPreferences { get; set; } = new InteractionPreferences();
    }
    public sealed class NotificationPreferences { public bool Enabled { get; set; } = true; public bool Email { get; set; } = true; }
    public sealed class MrPreferences { public bool ComfortMode { get; set; } }
    public sealed class InteractionPreferences { public string DominantHand { get; set; } = "RIGHT"; }
}
