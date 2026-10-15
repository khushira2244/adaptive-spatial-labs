using System;
using System.IO;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;

internal static class SyntaxRunner
{
    private static int Main(string[] args)
    {
        var files = Directory.GetFiles(args[0], "*.cs", SearchOption.AllDirectories);
        var errors = 0;
        foreach (var path in files)
        {
            var tree = CSharpSyntaxTree.ParseText(File.ReadAllText(path),
                new CSharpParseOptions(LanguageVersion.CSharp9), path);
            foreach (var diagnostic in tree.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error))
            { Console.WriteLine(diagnostic); errors++; }
        }
        Console.WriteLine($"C# syntax: {files.Length} source files checked, {errors} syntax errors. This is not a Unity typecheck.");
        return errors == 0 ? 0 : 1;
    }
}
