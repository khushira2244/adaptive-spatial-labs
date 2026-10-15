using Newtonsoft.Json;

namespace AdaptiveSpatialLabs.Models.Api
{
    public sealed class ProjectSourceInput
    {
        public string SourceType { get; set; }
        public string Name { get; set; }
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)] public string UploadId { get; set; }
        public string ExternalReference { get; set; }
        public string Note { get; set; }
    }
    public sealed class ProjectSourceDto
    {
        public string Id { get; set; }
        public string ProjectId { get; set; }
        public string SourceType { get; set; }
        public string Name { get; set; }
        public string Status { get; set; }
        public bool HasFile { get; set; }
        public string ExternalReference { get; set; }
        public SourceMetadataDto Metadata { get; set; }
        public string AddedByUserId { get; set; }
        public string CreatedAt { get; set; }
        public string UpdatedAt { get; set; }
    }
    public sealed class SourceMetadataDto
    {
        public string ContentType { get; set; }
        public int? ByteSize { get; set; }
        public string Note { get; set; }
    }
}
