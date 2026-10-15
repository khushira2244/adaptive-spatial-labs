using System.Collections.Generic;
using UnityEngine;
using AdaptiveSpatialLabs.Editor.UI;
using AdaptiveSpatialLabs.UI.Components.Buttons;
using AdaptiveSpatialLabs.UI.Components.Cards;
using AdaptiveSpatialLabs.UI.Components.Inputs;
using AdaptiveSpatialLabs.UI.Components.States;
using AdaptiveSpatialLabs.UI.DesignSystem;
using AdaptiveSpatialLabs.UI.DesignSystem.Icons;

namespace AdaptiveSpatialLabs.Editor
{
    internal static class ComponentLibraryBuilder
    {
        public static IReadOnlyList<GameObject> Build(DesignTheme theme)
        {
            var result=new List<GameObject>();
            void Save(Component component,string group,string name) => result.Add(UiPrimitives.Save(component.gameObject,"UI/Prefabs/Components/"+group+"/"+name+".prefab"));
            Save(ButtonFactory.Create<PrimaryButton>("PrimaryButton",null,"Primary action",theme,true),"Buttons","PrimaryButton");
            Save(ButtonFactory.Create<SecondaryButton>("SecondaryButton",null,"Secondary action",theme),"Buttons","SecondaryButton");
            Save(ButtonFactory.Icon(null,IconKind.Plus,theme),"Buttons","IconButton");
            Save(InputFactory.Text<TextInput>(null,"Enter text",theme),"Inputs","TextInput");
            Save(InputFactory.Text<PasswordInput>(null,"Password",theme,true),"Inputs","PasswordInput");
            Save(InputFactory.Text<SearchInput>(null,"Search",theme,false,true),"Inputs","SearchInput");
            Save(InputFactory.Dropdown(null,theme),"Dropdowns","DropdownInput");
            Save(CardFactory.Card<StandardCard>(null,theme),"Cards","StandardCard");
            Save(CardFactory.Project(null,theme),"Cards","ProjectCard");
            var sidebar=ShellFactory.Sidebar(null,theme);
            System.IO.Directory.CreateDirectory(FoundationPaths.Root+"/UI/Prefabs/Components/Sidebar");
            result.Add(UnityEditor.PrefabUtility.SaveAsPrefabAsset(sidebar.Items[0].gameObject,FoundationPaths.Root+"/UI/Prefabs/Components/Sidebar/SidebarNavItem.prefab"));
            Save(sidebar,"Sidebar","Sidebar");
            Save(ShellFactory.TopBar(null,theme,theme.Dimensions.PanelUnits.x),"TopBar","TopBar");
            Save(CompositeFactory.Tabs(null,theme),"Tabs","TabControl");
            Save(CompositeFactory.Step(null,theme,1,"Basics"),"Stepper","StepIndicator");
            Save(CompositeFactory.Steps(null,theme,900),"Stepper","Stepper");
            Save(CompositeFactory.Badge(null,theme),"Badges","StatusBadge");
            Save(CompositeFactory.Avatar(null,theme),"Avatar","Avatar");
            Save(CardFactory.Header(null,theme),"Headers","SectionHeader");
            Save(CardFactory.Message<LoadingState>(null,theme,"Loading","Please wait."),"Loading","LoadingState");
            Save(CardFactory.Message<ErrorState>(null,theme,"Something went wrong","Please try again.",true),"Errors","ErrorState");
            Save(CardFactory.Message<EmptyState>(null,theme,"No items yet","Your items will appear here."),"EmptyStates","EmptyState");
            return result;
        }
    }
}
