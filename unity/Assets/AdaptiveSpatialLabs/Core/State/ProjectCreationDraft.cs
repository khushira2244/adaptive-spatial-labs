using System.Collections.Generic;
using AdaptiveSpatialLabs.Models.Api;

namespace AdaptiveSpatialLabs.Core.State
{
    public sealed class ProjectCreationDraft
    {
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
        public OrganizationDto Organization { get; set; }
        public string ProjectType { get; set; } = "PRODUCT_SYSTEM";
        public string Visibility { get; set; } = "RESTRICTED";
        public string TemplateKey { get; set; } = "PRODUCT_SYSTEM";
        public bool LayersConfigured { get; set; }
        public List<ProjectLayerInput> Layers { get; } = new List<ProjectLayerInput>();
        public List<ProjectSourceInput> Sources { get; } = new List<ProjectSourceInput>();
        public List<OrganizationMemberDto> Editors { get; } = new List<OrganizationMemberDto>();
    }
}
