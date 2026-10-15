using UnityEngine;
using UnityEngine.UI;

namespace AdaptiveSpatialLabs.UI.DesignSystem.Icons
{
    public enum IconKind { Home, Meetings, Cube, Mail, Settings, Search, Plus, User, Eye, Back, Close, ChevronDown }

    [RequireComponent(typeof(CanvasRenderer))]
    public sealed class LineIcon : MaskableGraphic
    {
        public IconKind Kind;
        [SerializeField] private float lineWidth = 1.8f;
        protected override void OnPopulateMesh(VertexHelper mesh)
        {
            mesh.Clear();
            switch (Kind)
            {
                case IconKind.Home:
                    Path(mesh, new[] { P(.1f,.48f), P(.5f,.85f), P(.9f,.48f) });
                    Path(mesh, new[] { P(.22f,.54f), P(.22f,.15f), P(.78f,.15f), P(.78f,.54f) });
                    Path(mesh, new[] { P(.42f,.15f), P(.42f,.42f), P(.58f,.42f), P(.58f,.15f) }); break;
                case IconKind.Meetings:
                    Box(mesh,.1f,.25f,.55f,.5f); Path(mesh,new[] { P(.65f,.58f),P(.9f,.75f),P(.9f,.25f),P(.65f,.42f) }); break;
                case IconKind.Cube:
                    Path(mesh,new[] { P(.5f,.9f),P(.86f,.7f),P(.86f,.3f),P(.5f,.1f),P(.14f,.3f),P(.14f,.7f),P(.5f,.9f) });
                    Path(mesh,new[] { P(.14f,.7f),P(.5f,.5f),P(.86f,.7f) }); Line(mesh,P(.5f,.5f),P(.5f,.1f)); break;
                case IconKind.Mail:
                    Box(mesh,.1f,.23f,.8f,.54f); Path(mesh,new[] { P(.1f,.77f),P(.5f,.43f),P(.9f,.77f) }); break;
                case IconKind.Settings:
                    Circle(mesh,P(.5f,.5f),.2f);
                    for (var i=0;i<8;i++) { var a=i*Mathf.PI/4; var v=new Vector2(Mathf.Cos(a),Mathf.Sin(a)); Line(mesh,P(.5f,.5f)+v*rectTransform.rect.width*.32f,P(.5f,.5f)+v*rectTransform.rect.width*.43f); }
                    Circle(mesh,P(.5f,.5f),.34f); break;
                case IconKind.Search: Circle(mesh,P(.42f,.58f),.27f); Line(mesh,P(.62f,.38f),P(.88f,.12f)); break;
                case IconKind.Plus: Line(mesh,P(.18f,.5f),P(.82f,.5f)); Line(mesh,P(.5f,.18f),P(.5f,.82f)); break;
                case IconKind.User: Circle(mesh,P(.5f,.7f),.16f); Path(mesh,new[] { P(.2f,.15f),P(.25f,.35f),P(.5f,.44f),P(.75f,.35f),P(.8f,.15f),P(.2f,.15f) }); break;
                case IconKind.Eye: Path(mesh,new[] { P(.1f,.5f),P(.3f,.73f),P(.5f,.8f),P(.7f,.73f),P(.9f,.5f),P(.7f,.27f),P(.5f,.2f),P(.3f,.27f),P(.1f,.5f) }); Circle(mesh,P(.5f,.5f),.15f); break;
                case IconKind.Back: Path(mesh,new[] { P(.6f,.8f),P(.3f,.5f),P(.6f,.2f) }); break;
                case IconKind.Close: Line(mesh,P(.2f,.2f),P(.8f,.8f)); Line(mesh,P(.2f,.8f),P(.8f,.2f)); break;
                case IconKind.ChevronDown: Path(mesh,new[] { P(.2f,.65f),P(.5f,.35f),P(.8f,.65f) }); break;
            }
        }
        private Vector2 P(float x,float y) { var r=rectTransform.rect; return new Vector2(r.xMin+x*r.width,r.yMin+y*r.height); }
        private void Box(VertexHelper mesh,float x,float y,float w,float h) => Path(mesh,new[] { P(x,y),P(x+w,y),P(x+w,y+h),P(x,y+h),P(x,y) });
        private void Path(VertexHelper mesh,Vector2[] points) { for(var i=1;i<points.Length;i++) Line(mesh,points[i-1],points[i]); }
        private void Circle(VertexHelper mesh,Vector2 center,float radius)
        { var r=radius*Mathf.Min(rectTransform.rect.width,rectTransform.rect.height); for(var i=0;i<32;i++) { var a=i*Mathf.PI*2/32; var b=(i+1)*Mathf.PI*2/32; Line(mesh,center+new Vector2(Mathf.Cos(a),Mathf.Sin(a))*r,center+new Vector2(Mathf.Cos(b),Mathf.Sin(b))*r); } }
        private void Line(VertexHelper mesh,Vector2 start,Vector2 end)
        {
            var delta=(end-start).normalized; var n=new Vector2(-delta.y,delta.x)*lineWidth*.5f; var index=mesh.currentVertCount;
            Add(mesh,start+n); Add(mesh,end+n); Add(mesh,end-n); Add(mesh,start-n);
            mesh.AddTriangle(index,index+1,index+2); mesh.AddTriangle(index,index+2,index+3);
        }
        private void Add(VertexHelper mesh,Vector2 position) { var v=UIVertex.simpleVert; v.position=position; v.color=color; mesh.AddVert(v); }
    }
}
