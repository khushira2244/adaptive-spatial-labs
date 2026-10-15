using System.Collections.Generic;
using Newtonsoft.Json;

namespace AdaptiveSpatialLabs.Models.Api
{
    public class ProjectDto
    {
        public string Id { get; set; }
        public string OrganizationId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string ProjectType { get; set; }
        public string Visibility { get; set; }
        public string OwnerUserId { get; set; }
        public string Status { get; set; }
        public string CreatedAt { get; set; }
        public string UpdatedAt { get; set; }
    }
    public sealed class CreateProjectResponse : ProjectDto { }
    public sealed class CreateProjectRequest
    {
        public string Name { get; set; }
        public string Description { get; set; } = "";
        public string OrganizationId { get; set; }
        public string ProjectType { get; set; } = "PRODUCT_SYSTEM";
        public string Visibility { get; set; } = "RESTRICTED";
        public ProjectStructureInput Structure { get; set; } = new ProjectStructureInput();
        public List<string> EditorUserIds { get; set; } = new List<string>();
        public List<ProjectSourceInput> Sources { get; set; } = new List<ProjectSourceInput>();
    }
    public sealed class ProjectStructureInput
    {
        public string TemplateKey { get; set; } = "PRODUCT_SYSTEM";
        // Null means omit and use backend preset; empty list explicitly means no layers.
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)] public List<ProjectLayerInput> Layers { get; set; }
    }
    public sealed class ProjectLayerInput
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public int SortOrder { get; set; }
        public string Source { get; set; } = "USER_CREATED";
    }
    public sealed class ProjectEditorDto
    {
        public string ProjectId { get; set; }
        public string UserId { get; set; }
        public string AddedByUserId { get; set; }
        public string CreatedAt { get; set; }
        // List-only joined fields; not present on add response.
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)] public string FullName { get; set; }
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)] public string Designation { get; set; }
    }
    public sealed class ProjectStructureDto
    {
        public string Id { get; set; }
        public string ProjectId { get; set; }
        public string TemplateKey { get; set; }
        public string CreatedAt { get; set; }
        public string UpdatedAt { get; set; }
    }
    public sealed class ProjectLayerDto
    {
        public string Id { get; set; }
        public string ProjectId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public int SortOrder { get; set; }
        public string Source { get; set; }
        public string CreatedAt { get; set; }
        public string UpdatedAt { get; set; }
    }
}
