# Group 1 feature boundaries

Task 1 supplies shared contracts and state, not feature workflows. Later Group 1 tasks can add Auth, Projects, Organizations, Sources, and Preferences feature services here. They consume `Core/Networking/IApiClient` and emit state changes; UI components never make HTTP calls.

Do not implement those workflows, or Group 2 features, during this foundation increment.
