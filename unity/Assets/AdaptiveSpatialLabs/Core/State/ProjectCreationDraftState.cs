using System;

namespace AdaptiveSpatialLabs.Core.State
{
    public sealed class ProjectCreationDraftState
    {
        public ProjectCreationDraft Draft { get; private set; } = new ProjectCreationDraft();
        public event Action Changed;
        public void Update(Action<ProjectCreationDraft> change)
        { if (change == null) throw new ArgumentNullException(nameof(change)); change(Draft); Changed?.Invoke(); }
        // Only an explicit restart clears the draft. Router/screen lifetimes have no ownership here.
        public void Reset() { Draft = new ProjectCreationDraft(); Changed?.Invoke(); }
    }
}
