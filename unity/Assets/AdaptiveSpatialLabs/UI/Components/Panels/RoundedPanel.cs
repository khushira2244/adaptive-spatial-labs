using UnityEngine;
using UnityEngine.UI;

namespace AdaptiveSpatialLabs.UI.Components.Panels
{
    // Native UI geometry: filled rounded panel and a thin border, with no glow or extra material.
    [RequireComponent(typeof(CanvasRenderer))]
    public sealed class RoundedPanel : MaskableGraphic
    {
        [SerializeField] private float radius = 16f;
        [SerializeField] private float borderWidth = 1.25f;
        [SerializeField] private Color borderColor = new Color(0.2f, 0.32f, 0.42f);
        public void Style(Color fill, Color border, float cornerRadius, float thickness)
        { color = fill; borderColor = border; radius = cornerRadius; borderWidth = thickness; SetVerticesDirty(); }

        protected override void OnPopulateMesh(VertexHelper mesh)
        {
            mesh.Clear(); var rect = rectTransform.rect;
            if (rect.width <= 0 || rect.height <= 0) return;
            const int segments = 8;
            const int count = 4 * (segments + 1);
            var outerRadius = Mathf.Clamp(radius, 0, Mathf.Min(rect.width, rect.height) / 2f);
            var thickness = Mathf.Clamp(borderWidth, 0, Mathf.Min(rect.width, rect.height) / 2f);
            var innerRect = new Rect(rect.x + thickness, rect.y + thickness, rect.width - 2 * thickness, rect.height - 2 * thickness);
            var innerRadius = Mathf.Max(0, outerRadius - thickness);
            AddVertex(mesh, rect.center, color);
            for (var i = 0; i < count; i++) AddVertex(mesh, Point(innerRect, innerRadius, i, segments), color);
            for (var i = 0; i < count; i++) mesh.AddTriangle(0, i + 1, (i + 1) % count + 1);
            var outerStart = count + 1;
            for (var i = 0; i < count; i++) AddVertex(mesh, Point(rect, outerRadius, i, segments), borderColor);
            var innerStart = outerStart + count;
            for (var i = 0; i < count; i++) AddVertex(mesh, Point(innerRect, innerRadius, i, segments), borderColor);
            for (var i = 0; i < count; i++)
            {
                var next = (i + 1) % count;
                mesh.AddTriangle(outerStart + i, outerStart + next, innerStart + i);
                mesh.AddTriangle(innerStart + i, outerStart + next, innerStart + next);
            }
        }
        private static Vector2 Point(Rect rect, float radius, int index, int segments)
        {
            var corner = index / (segments + 1); var step = index % (segments + 1);
            var center = new Vector2(corner == 0 || corner == 3 ? rect.xMax - radius : rect.xMin + radius,
                corner < 2 ? rect.yMax - radius : rect.yMin + radius);
            var angle = (corner * 90f + step * 90f / segments) * Mathf.Deg2Rad;
            return center + new Vector2(Mathf.Cos(angle), Mathf.Sin(angle)) * radius;
        }
        private static void AddVertex(VertexHelper mesh, Vector2 point, Color color)
        { var vertex = UIVertex.simpleVert; vertex.position = point; vertex.color = color; mesh.AddVert(vertex); }
    }
}
