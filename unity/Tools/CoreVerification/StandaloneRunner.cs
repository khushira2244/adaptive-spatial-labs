using System.Reflection;
using NUnitLite;

internal static class StandaloneRunner
{
    private static int Main(string[] args) => new AutoRun(Assembly.GetExecutingAssembly()).Execute(args);
}
