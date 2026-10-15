using TMPro;

namespace AdaptiveSpatialLabs.UI.Components.Inputs
{
    public sealed class PasswordInput : TextInput
    {
        public void SetVisible(bool visible)
        { control.contentType = visible ? TMP_InputField.ContentType.Standard : TMP_InputField.ContentType.Password; control.ForceLabelUpdate(); }
    }
}
