using System;
using System.Collections.Generic;

namespace AdaptiveSpatialLabs.Core.Navigation
{
    public enum ShellKind { Public, Authenticated }

    public sealed class RouteDefinition
    {
        public ScreenRoute Route { get; }
        public string Title { get; }
        public ShellKind Shell { get; }
        public ScreenRoute? SidebarSelection { get; }
        public int WizardStep { get; }

        public RouteDefinition(ScreenRoute route, string title, ShellKind shell,
            ScreenRoute? sidebarSelection = null, int wizardStep = -1)
        {
            Route = route; Title = title; Shell = shell;
            SidebarSelection = sidebarSelection; WizardStep = wizardStep;
        }
    }

    public static class Group1Routes
    {
        public static readonly IReadOnlyList<RouteDefinition> All = Array.AsReadOnly(new[]
        {
            new RouteDefinition(ScreenRoute.Landing, "See. Decide. Together.", ShellKind.Public),
            new RouteDefinition(ScreenRoute.SignUp, "Create your account", ShellKind.Public),
            new RouteDefinition(ScreenRoute.SignIn, "Welcome back", ShellKind.Public),
            new RouteDefinition(ScreenRoute.Home, "Projects", ShellKind.Authenticated, ScreenRoute.Home),
            new RouteDefinition(ScreenRoute.Meetings, "Meetings", ShellKind.Authenticated, ScreenRoute.Meetings),
            new RouteDefinition(ScreenRoute.MySpace, "My Space", ShellKind.Authenticated, ScreenRoute.MySpace),
            new RouteDefinition(ScreenRoute.Inbox, "Inbox", ShellKind.Authenticated, ScreenRoute.Inbox),
            new RouteDefinition(ScreenRoute.Profile, "Profile", ShellKind.Authenticated),
            new RouteDefinition(ScreenRoute.Settings, "Settings", ShellKind.Authenticated, ScreenRoute.Settings),
            new RouteDefinition(ScreenRoute.ProjectCreationBasics, "Project Basics", ShellKind.Authenticated, ScreenRoute.Home, 0),
            new RouteDefinition(ScreenRoute.ProjectCreationStructure, "Project Structure", ShellKind.Authenticated, ScreenRoute.Home, 1),
            new RouteDefinition(ScreenRoute.ProjectCreationInputs, "Existing Inputs", ShellKind.Authenticated, ScreenRoute.Home, 2),
            new RouteDefinition(ScreenRoute.ProjectCreationEditors, "Project Editors", ShellKind.Authenticated, ScreenRoute.Home, 3),
            new RouteDefinition(ScreenRoute.ProjectCreationReview, "Review & Create", ShellKind.Authenticated, ScreenRoute.Home, 4),
            new RouteDefinition(ScreenRoute.ProjectCreationSuccess, "Project Created", ShellKind.Authenticated, ScreenRoute.Home)
        });

        public static RouteDefinition Get(ScreenRoute route)
        {
            foreach (var definition in All) if (definition.Route == route) return definition;
            throw new ArgumentOutOfRangeException(nameof(route));
        }
    }
}
