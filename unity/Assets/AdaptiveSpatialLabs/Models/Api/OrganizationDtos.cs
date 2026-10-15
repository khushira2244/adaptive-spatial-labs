using Newtonsoft.Json;

namespace AdaptiveSpatialLabs.Models.Api
{
    public sealed class OrganizationDto
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string CreatedAt { get; set; }
        public string UpdatedAt { get; set; }
        // Present on organization listing, absent on creation/signup.
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)] public string MembershipRole { get; set; }
    }
    public sealed class OrganizationMemberDto
    {
        public string Id { get; set; }
        public string FullName { get; set; }
        public string WorkEmail { get; set; }
        public string Designation { get; set; }
        public string TeamDepartment { get; set; }
        public string MembershipRole { get; set; }
    }
}
