using System;
using System.Collections.Generic;
using AdaptiveSpatialLabs.Core.Networking;
using AdaptiveSpatialLabs.Models.Api;

namespace AdaptiveSpatialLabs.Core.State
{
    public sealed class ProjectListState
    {
        private List<ProjectDto> items = new List<ProjectDto>();
        public IReadOnlyList<ProjectDto> Items => JsonCodec.Copy(items).AsReadOnly();
        public bool IsLoading { get; private set; }
        public ApiError Error { get; private set; }
        public event Action Changed;
        public void BeginLoad() { IsLoading = true; Error = null; Changed?.Invoke(); }
        public void Replace(IEnumerable<ProjectDto> projects)
        { items = JsonCodec.Copy(new List<ProjectDto>(projects)); IsLoading = false; Error = null; Changed?.Invoke(); }
        public void Fail(ApiError error) { IsLoading = false; Error = JsonCodec.Copy(error); Changed?.Invoke(); }
        public void Clear() { items.Clear(); IsLoading = false; Error = null; Changed?.Invoke(); }
    }
}
