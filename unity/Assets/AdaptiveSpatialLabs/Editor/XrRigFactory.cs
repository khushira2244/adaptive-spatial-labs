using Unity.XR.CoreUtils;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.XR;
using UnityEngine.XR.ARFoundation;
using UnityEngine.XR.Interaction.Toolkit;
using UnityEngine.XR.Interaction.Toolkit.Inputs.Readers;
using UnityEngine.XR.Interaction.Toolkit.Interactors;
using UnityEngine.XR.Interaction.Toolkit.Interactors.Visuals;
using UnityEngine.XR.Interaction.Toolkit.UI;

namespace AdaptiveSpatialLabs.Editor
{
    internal static class XrRigFactory
    {
        public static Camera Create()
        {
            var root=new GameObject("QuestXROrigin"); var origin=root.AddComponent<XROrigin>();
            root.AddComponent<XRInteractionManager>();
            var offset=new GameObject("CameraOffset"); offset.transform.SetParent(root.transform,false);
            origin.CameraFloorOffsetObject=offset; origin.RequestedTrackingOriginMode=XROrigin.TrackingOriginMode.Device; origin.CameraYOffset=1.2f;
            offset.transform.localPosition=new Vector3(0,1.2f,0);
            var cameraObject=new GameObject("HeadCamera"); cameraObject.transform.SetParent(offset.transform,false); cameraObject.tag="MainCamera";
            var camera=cameraObject.AddComponent<Camera>(); camera.nearClipPlane=.05f; camera.farClipPlane=25;
            camera.clearFlags=CameraClearFlags.SolidColor; camera.backgroundColor=new Color(.025f,.05f,.08f,0); camera.fieldOfView=65;
            origin.Camera=camera;
            var pose=cameraObject.AddComponent<TrackedPoseDriver>();
            pose.positionInput=new InputActionProperty(new InputAction("HeadPosition",InputActionType.Value,"<XRHMD>/centerEyePosition"));
            pose.rotationInput=new InputActionProperty(new InputAction("HeadRotation",InputActionType.Value,"<XRHMD>/centerEyeRotation"));
            pose.trackingStateInput=new InputActionProperty(new InputAction("HeadTracking",InputActionType.Value,"<XRHMD>/trackingState"));
            cameraObject.AddComponent<ARCameraManager>(); cameraObject.AddComponent<ARCameraBackground>();
            root.AddComponent<ARSession>();
            Controller(offset.transform,"Left",true); Controller(offset.transform,"Right",false);
            var events=new GameObject("UIEventSystem"); events.AddComponent<EventSystem>();
            var ui=events.AddComponent<XRUIInputModule>(); ui.enableMouseInput=true; ui.enableXRInput=true;
            return camera;
        }
        private static void Controller(Transform parent,string side,bool left)
        {
            var controller=new GameObject(side+"RayController"); controller.transform.SetParent(parent,false);
            var device="<XRController>{"+(left?"LeftHand":"RightHand")+"}";
            var pose=controller.AddComponent<TrackedPoseDriver>();
            pose.positionInput=new InputActionProperty(new InputAction(side+"Position",InputActionType.Value,device+"/devicePosition"));
            pose.rotationInput=new InputActionProperty(new InputAction(side+"Rotation",InputActionType.Value,device+"/deviceRotation"));
            pose.trackingStateInput=new InputActionProperty(new InputAction(side+"Tracking",InputActionType.Value,device+"/trackingState"));
            var ray=controller.AddComponent<XRRayInteractor>(); ray.enableUIInteraction=true; ray.maxRaycastDistance=3f;
            ray.uiPressInput.inputSourceMode=XRInputButtonReader.InputSourceMode.InputAction;
            ray.uiPressInput.inputActionPerformed=new InputAction(side+"UIPress",InputActionType.Button,device+"/triggerPressed");
            ray.uiPressInput.inputActionValue=new InputAction(side+"UIPressValue",InputActionType.Value,device+"/trigger");
            var line=controller.AddComponent<LineRenderer>(); line.widthMultiplier=.002f;
            var materialPath=FoundationPaths.Root+"/Configuration/ControllerRay.mat";
            var material=UnityEditor.AssetDatabase.LoadAssetAtPath<Material>(materialPath);
            if(material==null) { material=new Material(Shader.Find("Sprites/Default")); UnityEditor.AssetDatabase.CreateAsset(material,materialPath); }
            line.sharedMaterial=material;
            var visual=controller.AddComponent<XRInteractorLineVisual>(); visual.lineWidth=.002f;
        }
    }
}
