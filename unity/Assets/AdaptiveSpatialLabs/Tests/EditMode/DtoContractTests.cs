using NUnit.Framework;
using Newtonsoft.Json.Linq;
using AdaptiveSpatialLabs.Core.Networking;
using AdaptiveSpatialLabs.Models.Api;

namespace AdaptiveSpatialLabs.Tests
{
    public sealed class DtoContractTests
    {
        [Test] public void DeserializesActualBackendProjectEnvelope()
        {
            const string json="{\"data\":{\"id\":\"6a37362a-4a4c-4c78-86b3-12453a0b81b7\",\"organizationId\":\"ea37362a-4a4c-4c78-86b3-12453a0b81b7\",\"name\":\"Payments Platform\",\"description\":\"Core payments\",\"projectType\":\"PRODUCT_SYSTEM\",\"visibility\":\"RESTRICTED\",\"ownerUserId\":\"ba37362a-4a4c-4c78-86b3-12453a0b81b7\",\"status\":\"ACTIVE\",\"createdAt\":\"2026-10-12T12:00:00.000Z\",\"updatedAt\":\"2026-10-12T12:00:00.000Z\"}}";
            var dto=JsonCodec.Deserialize<ApiResponse<ProjectDto>>(json).Data;
            Assert.That(dto.Name,Is.EqualTo("Payments Platform")); Assert.That(dto.ProjectType,Is.EqualTo("PRODUCT_SYSTEM")); Assert.That(dto.CreatedAt,Is.EqualTo("2026-10-12T12:00:00.000Z")); Assert.That(System.Guid.TryParse(dto.Id,out _),Is.True);
        }
        [Test] public void DeserializesBackendErrorWithExplicitNullDetails()
        { var dto=JsonCodec.Deserialize<ApiErrorResponse>("{\"error\":{\"code\":\"PROJECT_FORBIDDEN\",\"message\":\"You do not have access to this project.\",\"details\":null}}"); Assert.That(dto.Error.Code,Is.EqualTo("PROJECT_FORBIDDEN")); Assert.That(dto.Error.Details,Is.Null); }
        [Test] public void NullableUserFieldsRemainNull()
        { var user=JsonCodec.Deserialize<ApiResponse<UserDto>>("{\"data\":{\"id\":\"u\",\"fullName\":\"Name\",\"workEmail\":\"name@example.com\",\"designation\":\"OTHER\",\"teamDepartment\":null,\"profileImage\":null}}").Data; Assert.That(user.TeamDepartment,Is.Null); Assert.That(user.ProfileImage,Is.Null); }
        [Test] public void CreateRequestHasCamelCaseAndNoOwnerOrStatus()
        {
            var dto=new CreateProjectRequest { Name="Payments",OrganizationId="org" }; var json=JObject.Parse(JsonCodec.Serialize(dto));
            Assert.That(json["name"].Value<string>(),Is.EqualTo("Payments")); Assert.That(json["ownerUserId"],Is.Null); Assert.That(json["status"],Is.Null); Assert.That(json["structure"]["layers"],Is.Null);
            dto.Structure.Layers=new System.Collections.Generic.List<ProjectLayerInput>(); Assert.That(JObject.Parse(JsonCodec.Serialize(dto))["structure"]["layers"].Type,Is.EqualTo(JTokenType.Array));
        }
        [Test] public void ProfilePatchDistinguishesOmittedFromExplicitNull()
        {
            var dto=new UpdateProfileRequest { FullName="Name" }; var json=JObject.Parse(JsonCodec.Serialize(dto)); Assert.That(json["teamDepartment"],Is.Null); Assert.That(json["designation"],Is.Null);
            dto.IncludeTeamDepartment=true; json=JObject.Parse(JsonCodec.Serialize(dto)); Assert.That(json["teamDepartment"].Type,Is.EqualTo(JTokenType.Null)); Assert.That(json["includeTeamDepartment"],Is.Null);
        }
        [Test] public void SourceDtoUsesHasFileAndFixedMetadataNotStoragePaths()
        { var dto=JsonCodec.Deserialize<ApiResponse<ProjectSourceDto>>("{\"data\":{\"id\":\"s\",\"projectId\":\"p\",\"sourceType\":\"FILE\",\"name\":\"Document\",\"status\":\"UPLOADED\",\"hasFile\":true,\"externalReference\":null,\"metadata\":{\"contentType\":\"text/plain\",\"byteSize\":28,\"note\":null},\"addedByUserId\":\"u\"}}").Data; Assert.That(dto.HasFile,Is.True); Assert.That(dto.Metadata.ByteSize,Is.EqualTo(28)); Assert.That(JsonCodec.Serialize(dto),Does.Not.Contain("storageKey")); }
        [Test] public void PreferenceShapeMatchesBackend()
        { var dto=JsonCodec.Deserialize<UserPreferenceDto>("{\"theme\":\"DARK\",\"reduceMotion\":true,\"notifications\":{\"enabled\":true,\"email\":false},\"mrPreferences\":{\"comfortMode\":true},\"interactionPreferences\":{\"dominantHand\":\"LEFT\"}}"); Assert.That(dto.MrPreferences.ComfortMode,Is.True); Assert.That(dto.InteractionPreferences.DominantHand,Is.EqualTo("LEFT")); }
        [Test] public void SignupAndRefreshResponsesUseDifferentBackendDataShapes()
        { var signup=JsonCodec.Deserialize<ApiResponse<SignUpResponse>>("{\"data\":{\"user\":{\"id\":\"u\"},\"organization\":{\"id\":\"o\"},\"tokens\":{\"accessToken\":\"access\",\"refreshToken\":\"refresh\",\"tokenType\":\"Bearer\"}}}"); Assert.That(signup.Data.Tokens.AccessToken,Is.EqualTo("access")); var refresh=JsonCodec.Deserialize<ApiResponse<RefreshResponse>>("{\"data\":{\"accessToken\":\"new-access\",\"refreshToken\":\"new-refresh\",\"tokenType\":\"Bearer\"}}"); Assert.That(refresh.Data.AccessToken,Is.EqualTo("new-access")); }
    }
}
