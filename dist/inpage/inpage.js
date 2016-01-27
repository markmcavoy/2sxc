


// Maps actions of the module menu to JS actions - needed because onclick event can't be set (actually, a bug in DNN)
var $2sxcActionMenuMapper = function (moduleId) {
    return {
        changeLayoutOrContent: function () {
            $2sxc(moduleId).manage.action({ 'action': 'layout' });
        },
        addItem: function () {
            $2sxc(moduleId).manage.action({ 'action': 'add', 'useModuleList': true });
        },
        edit: function () {
            $2sxc(moduleId).manage.action({ 'action': 'edit', 'useModuleList': true, 'sortOrder': 0 });
        },
        adminApp: function () {
            $2sxc(moduleId).manage.action({ 'action': 'app' });
        },
        adminZone: function () {
            $2sxc(moduleId).manage.action({ 'action': 'zone' });
        },
        develop: function () {
            $2sxc(moduleId).manage.action({ 'action': 'develop' });
        }
    };
};
angular.module('SxcInpageTemplates', []).run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('template-selector/template-selector.html',
    "<div ng-cloak ng-show=vm.manageInfo.templateChooserVisible class=\"dnnFormMessage dnnFormInfo\"><div class=sc-selectors><select ng-show=!vm.manageInfo.isContentApp ng-model=vm.appId class=sc-selector-app ng-options=\"a.AppId as a.Name for a in vm.apps\" ng-disabled=\"vm.manageInfo.hasContent || vm.manageInfo.isList\"><option value=\"\" ng-disabled=\"vm.appId != null\" translate=TemplatePicker.AppPickerDefault></option></select><select ng-show=vm.manageInfo.isContentApp ng-model=vm.contentTypeId class=sc-selector-contenttype ng-options=\"c.StaticName as c.Name for c in vm.contentTypes\" ng-disabled=\"vm.manageInfo.hasContent || vm.manageInfo.isList\"><option ng-disabled=\"vm.contentTypeId != ''\" value=\"\" translate=TemplatePicker.ContentTypePickerDefault></option></select><select ng-show=\"vm.manageInfo.isContentApp ? vm.contentTypeId != 0 : (vm.savedAppId != null &&  vm.filteredTemplates().length > 1)\" ng-model=vm.templateId class=sc-selector-template ng-options=\"t.TemplateId as t.Name for t in vm.filteredTemplates(vm.contentTypeId)\"></select></div><div class=sc-selector-actions>&nbsp; <a ng-show=\"vm.templateId != null && vm.savedTemplateId != vm.templateId\" class=sc-selector-save ng-click=\"vm.persistTemplate(false, false);\" title=\"{{ 'TemplatePicker.Save' | translate }}\"><div><i class=icon-sxc-ok></i></div></a> &nbsp; <a ng-show=\"vm.undoTemplateId != null\" class=sc-selector-close ng-click=vm.cancelTemplateChange(); title=\"{{ 'TemplatePicker.' + (vm.manageInfo.isContentApp ? 'Cancel' : 'Close') | translate }}\"><div><i class=icon-sxc-cancel></i></div></a></div><div class=sc-loading ng-show=vm.loading><i class=\"icon-sxc-spinner fa-spin\"></i></div></div>"
  );

}]);

// A helper-controller in charge of opening edit-dialogs + creating the toolbars for it

// all in-page toolbars etc.
$2sxc.getManageController = function (id) {

    var moduleElement = $(".DnnModule-" + id);
    var manageInfo = $.parseJSON(moduleElement.find("div[data-2sxc]").attr("data-2sxc")).manage;
    var sxcGlobals = $.parseJSON(moduleElement.find("div[data-2sxc-globals]").attr("data-2sxc-globals"));
    manageInfo.ngDialogUrl = manageInfo.applicationRoot + "desktopmodules/tosic_sexycontent/dist/dnn/ui.html";

    manageInfo.ngDialogParams = {
        zoneId: manageInfo.zoneId,
        appId: manageInfo.appId,
        tid: manageInfo.config.tabId,
        mid: manageInfo.config.moduleId,
        lang: manageInfo.lang,
        langpri: manageInfo.langPrimary,
        langs: JSON.stringify(manageInfo.languages),
        portalroot: sxcGlobals.PortalRoot,
        websiteroot: manageInfo.applicationRoot,
        user: manageInfo.user,
        // note that the app-root doesn't exist when opening "manage-app"
        approot: (manageInfo.config && manageInfo.config.appPath) ? manageInfo.config.appPath : null // this is the only value which doesn't have a slash by default
    };

    var contentTypeName = manageInfo.contentTypeId; // note: only exists if the template has a content-type
    var toolbarConfig = manageInfo.config;
    toolbarConfig.contentType = toolbarConfig.contentType || toolbarConfig.attributeSetName;
    var enableTools = manageInfo.user.canDesign;
    var enableDevelop = manageInfo.user.canDevelop;
    var isContent = manageInfo.isContentApp;

    function buttonConfig(name, translateKey, icon, show,  uiOnly, more) {
        return angular.extend({
            title: "Toolbar." + translateKey,
            iclass: "icon-sxc-" + icon,
            showOn: show,
            uiActionOnly: uiOnly
        }, more);
    }

    var actionButtonsConf = {
        'edit': buttonConfig('edit', "Edit", "pencil", "default", false, { params: { mode: "edit" } }),
        // new is a dialog to add something, and will not add if cancelled
        // new can also be used for mini-toolbars which just add an entity not attached to a module
        // in that case it's essential to add a contentType like 
        // <ul class="sc-menu" data-toolbar='{"action":"new", "contentType": "Category"}'></ul>
        'new': buttonConfig('new', "New", "plus", "default", false, { params: { mode: "new" },
            dialog: "edit", // don't use "new" (default) but use "edit"
            addCondition: function(settings) { return toolbarConfig.isList && settings.sortOrder !== -1; },
            code: function (settings, event) {
                tbContr._openNgDialog($.extend({}, settings, { sortOrder: settings.sortOrder + 1 }), event);
            }
        }),
        // add brings no dialog, just add an empty item
        'add': buttonConfig('add', "AddDemo", "plus-circled", "edit", false, {
            addCondition: function(settings) { return toolbarConfig.isList && settings.sortOrder !== -1 && settings.useModuleList; },
            code: function(settings, event) {
                tbContr._getAngularVm().addItem(settings.sortOrder + 1);
            }
        }),
        'replace': buttonConfig('replace', "Replace", "replace", "edit", false, {
            addCondition: function(settings) { return settings.useModuleList; },
        }),
        'publish': buttonConfig('publish', "Published", "eye", "edit", false, {
            iclass2: "icon-sxc-eye-off",
            disabled: true,
            code: function(settings, event) {
                if (settings.isPublished) {
                    alert(tbContr.translate("Toolbar.AlreadyPublished"));
                    return;
                }
                var part = settings.sortOrder === -1 ? "listcontent" : "content";
                var index = settings.sortOrder === -1 ? 0 : settings.sortOrder;
                tbContr._getAngularVm().publish(part, index);
            }
        }),

        'moveup': {
            title: "Toolbar.MoveUp",
            iclass: "icon-sxc-move-up",
            disabled: false,
            showOn: "edit",
            addCondition: function(settings) { return toolbarConfig.isList && settings.sortOrder !== -1 && settings.useModuleList && settings.sortOrder !== 0; },
            code: function(settings, event) {
                tbContr._getAngularVm().changeOrder(settings.sortOrder, Math.max(settings.sortOrder - 1, 0));
            }
        },
        'movedown': {
            title: "Toolbar.MoveDown",
            iclass: "icon-sxc-move-down",
            disabled: false,
            showOn: "edit",
            addCondition: function(settings) { return toolbarConfig.isList && settings.sortOrder !== -1 && settings.useModuleList; },
            code: function(settings, event) {
                tbContr._getAngularVm().changeOrder(settings.sortOrder, settings.sortOrder + 1);
            }
        },
        'sort': {
            title: "Toolbar.Sort",
            iclass: "icon-sxc-list-numbered",
            showOn: "edit",
            addCondition: function(settings) { return toolbarConfig.isList && settings.sortOrder !== -1; },
        },
        'remove': {
            title: "Toolbar.Remove",
            iclass: "icon-sxc-minus-circled",
            disabled: true,
            showOn: "edit",
            addCondition: function(settings) { return toolbarConfig.isList && settings.sortOrder !== -1; },
            code: function(settings, event) {
                if (confirm(tbContr.translate("Toolbar.ConfirmRemove"))) {
                    tbContr._getAngularVm().removeFromList(settings.sortOrder);
                }
            }
        },
        'layout': {
            title: "Toolbar.ChangeLayout",
            iclass: "icon-sxc-glasses",
            showOn: "default",
            uiActionOnly: true, // so it doesn't create the content when used
            code: function(settings, event) {
                tbContr._getAngularVm().toggle();
            }
        },
        'develop': buttonConfig("develop", "Develop", "code", "admin", true, {
            newWindow: true,
            addCondition: enableTools,         
        }),
        'contenttype': {
            title: "Toolbar.ContentType",
            iclass: "icon-sxc-fields",
            showOn: "admin",
            uiActionOnly: true,
            addCondition: enableTools,
        },
        'contentitems': {
            title: "Toolbar.ContentItems",
            iclass: "icon-sxc-table",
            showOn: "admin",
            params: { contentTypeName: contentTypeName },
            uiActionOnly: true, // so it doesn't create the content when used
            addCondition: enableTools && contentTypeName,
        },
        'app': {
            title: "Toolbar.App",
            iclass: "icon-sxc-settings",
            showOn: "admin",
            uiActionOnly: true, // so it doesn't create the content when used
            addCondition: enableTools,
        },
        'zone': {
            title: "Toolbar.Zone",
            iclass: "icon-sxc-manage",
            showOn: "admin",
            uiActionOnly: true, // so it doesn't create the content when used
            addCondition: enableTools,
        },
        "more": {
            title: "Toolbar.MoreActions",
            iclass: "icon-sxc-options btn-mode",
            showOn: "default,edit,design,admin",
            uiActionOnly: true, // so it doesn't create the content when clicked
            code: function(settings, event) {
                var fullMenu = $(event.target).closest("ul.sc-menu");
                var oldState = Number(fullMenu.attr("data-state") || 0);
                var newState = oldState + 1;
                if (newState === 2) newState = 3; // state 1 doesn't exist yet - skip
                newState = newState % (enableTools ? 4 : 3); // if tools are enabled, there are 4 states
                fullMenu.removeClass("show-set-" + oldState)
                    .addClass("show-set-" + newState)
                    .attr("data-state", newState);
            }
        }
    };

    var tbContr = {
        isEditMode: function() {
            return manageInfo.isEditMode;
        },

        // The config object has the following properties:
        // portalId, tabId, moduleId, contentGroupId, dialogUrl, returnUrl, appPath
        _toolbarConfig: toolbarConfig,

        _manageInfo: manageInfo,

        // create a dialog link
        getNgLink: function(specialSettings) {
            var settings = $.extend({}, toolbarConfig, specialSettings); // merge button with toolbar-settings

            var params = {
                dialog: settings.dialog || settings.action,
            };
            angular.extend(params, settings.params);
            var items = [];

            // when not using a content-group list, ...
            if (!settings.useModuleList) {
                if (settings.action !== "new")
                    items.push({ EntityId: settings.entityId });
                else if (settings.contentType || settings.attributeSetName)
                    items.push({ ContentTypeName: settings.contentType || settings.attributeSetName });
            }
            // when using a list, the sort-order is important to find the right item
            if (settings.useModuleList || settings.action === "replace" || settings.action === "sort") {
                var normalContent = (settings.sortOrder !== -1);
                var index = normalContent ? settings.sortOrder : 0;
                items.push({
                    Group: {
                        Guid: settings.contentGroupId,
                        Index: index,
                        Part: normalContent ? "content" : "listcontent",
                        Add: settings.action === "new"
                    },
                    Title: tbContr.translate("EditFormTitle." + (normalContent ? "Content" : "ListContent"))
                });
                if (settings.action !== "replace") // if not replace, also add the presentation
                    items.push({
                        Group: {
                            Guid: settings.contentGroupId,
                            Index: index,
                            Part: normalContent ? "presentation" : "listpresentation",
                            Add: settings.action === "new"
                        },
                        Title: tbContr.translate("EditFormTitle." + (normalContent ? "Presentation" : "ListPresentation"))
                    });
            }

            if (settings.action === "develop")
                items = [{ EntityId: manageInfo.templateId }];

            // when doing new, there may be a prefill in the link to initialize the new item
            if (settings.prefill) 
                for (var i = 0; i < items.length; i++)
                    items[i].Prefill = settings.prefill;

            // Serialize/json-ify the complex items-list
            if (items.length)
                params.items = JSON.stringify(items);

            return manageInfo.ngDialogUrl
                + "#" + $.param(manageInfo.ngDialogParams)
                + "&" + $.param(params);
        },

        // open a new dialog of the angular-ui
        _openNgDialog: function(settings, event, closeCallback) {
            
            var callback = function () {
                tbContr._getAngularVm().reload();
                closeCallback();
            };
            var link = tbContr.getNgLink(settings);

            if (settings.newWindow || (event && event.shiftKey))
                window.open(link);
            else
                $2sxc.totalPopup.open(link, callback);
        },

        // Perform a toolbar button-action - basically get the configuration and execute it's action
        action: function(settings, event) {
            var origEvent = event || window.event; // pre-save event because afterwards we have a promise, so the event-object changes; funky syntax is because of browser differences
            var conf = actionButtonsConf[settings.action];
            if (conf.newWindow) settings.newWindow = conf.newWindow;
            if (conf.params) settings.params = conf.params;
            if (conf.dialog) settings.dialog = conf.dialog;
            if (!settings.dialog) settings.dialog = settings.action; // old code uses "action" as the parameter, now use verb

            var fn = conf.code || tbContr._openNgDialog; // decide what action to perform

            if (conf.uiActionOnly)
                return fn(settings, origEvent);
            
            // if more than just a UI-action, then it needs to be sure the content-group is created first
            tbContr._getAngularVm().prepareToAddContent().then(function() {
                return fn(settings, origEvent);
            });
        },

        // Generate a button (an <a>-tag) for one specific toolbar-action. 
        // Expects: settings, an object containing the specs for the expected buton
        getButton: function(btnSettings) {
            // if the button belongs to a content-item, move the specs up to the item into the settings-object
            if (btnSettings.entity && btnSettings.entity._2sxcEditInformation) {
                if (btnSettings.entity._2sxcEditInformation.entityId) {
                    btnSettings.entityId = btnSettings.entity._2sxcEditInformation.entityId;
                    btnSettings.useModuleList = false;
                }
                if (btnSettings.entity._2sxcEditInformation.sortOrder) {
                    btnSettings.sortOrder = btnSettings.entity._2sxcEditInformation.sortOrder;
                    btnSettings.useModuleList = true;
                }
                delete btnSettings.entity;
            }

            // retrieve configuration for this button
            var conf = actionButtonsConf[btnSettings.action];

            var showClasses = "";
            var classesList = conf.showOn.split(",");
            for (var c = 0; c < classesList.length; c++)
                showClasses += " show-" + classesList[c];
            var button = $("<a />", {
                'class': "sc-" + btnSettings.action + " " + showClasses,
                'onclick': "javascript:$2sxc(" + id + ").manage.action(" + JSON.stringify(btnSettings) + ", event);",
                'title': tbContr.translate(conf.title)
            });
            var box = $("<div/>");
            var symbol = $("<i class=\"" + conf.iclass + "\" aria-hidden=\"true\"></i>");

            // todo: move the following lines into the button-config and just call from here
            // if publish-button and not published yet, show button (otherwise hidden) & change icon
            if (btnSettings.action === "publish" && btnSettings.isPublished === false) {
                button.addClass("show-default").removeClass("show-edit")
                    .attr("title", tbContr.translate("Toolbar.Unpublished")); 
                symbol.removeClass(conf.iclass).addClass(conf.iclass2);
            }

            button.html(box.html(symbol));

            return button[0].outerHTML;
        },

        // Builds the toolbar and returns it as HTML
        // expects settings - either for 1 button or for an array of buttons
        getToolbar: function(settings) {
            var buttons = settings.action
                ? [settings] // if single item with specified action, use this as our button-list
                : $.isArray(settings)
                ? settings // if it is an array, use that. Otherwise assume that we auto-generate all buttons with supplied settings
                : tbContr.createDefaultToolbar(settings);

            var tbClasses = "sc-menu show-set-0" + ((settings.sortOrder === -1) ? " listContent" : "");
            var toolbar = $("<ul />", { 'class': tbClasses, 'onclick': "javascript: var e = arguments[0] || window.event; e.stopPropagation();" });

            for (var i = 0; i < buttons.length; i++)
                toolbar.append($("<li />").append($(tbContr.getButton(buttons[i]))));

            return toolbar[0].outerHTML;
        },

        // Assemble a default toolbar instruction set
        createDefaultToolbar: function (settings) {
            // Create a standard menu with all standard buttons
            var buttons = [];
            buttons.add = function (verb) {
                if (Array.isArray(verb))
                    return verb.forEach(function(val) { buttons.add(val); });
                var add = actionButtonsConf[verb].addCondition;
                if (add === undefined || ((typeof (add) === 'function') ? add(settings) : add))
                    buttons.push($.extend({}, settings, { action: verb }));
            };
            buttons.add(["edit", "new", "add", "remove", "moveup", "movedown", "sort", "publish", "replace", "layout", "develop", "contenttype", "contentitems", "app", "zone", "more"]);
            return buttons;
        },

        // find all toolbar-info-attributes in the HTML, convert to <ul><li> toolbar
        _processToolbars: function() {
            $(".sc-menu[data-toolbar]", $(".DnnModule-" + id)).each(function() {
                var toolbarSettings = $.parseJSON($(this).attr("data-toolbar"));
                $(this).replaceWith($2sxc(id).manage.getToolbar(toolbarSettings));
            });
        },

        _getAngularVm: function() {
            var selectorElement = document.querySelector(".DnnModule-" + id + " .sc-selector-wrapper");
            return angular.element(selectorElement).scope().vm;
        },

        translate: function(key) {
            return tbContr._getAngularVm().translate(key);
        }

    };

    return tbContr;
};

// Toolbar bootstrapping (initialize all toolbars after loading page)
$(document).ready(function () {
    // Prevent propagation of the click (if menu was clicked)
    $(".sc-menu").click(function (e) {
        e.stopPropagation();
    });

    //var modules = $(".DnnModule-2sxc .Mod2sxcC[data-2sxc], .DnnModule-2sxc-app .Mod2sxcappC[data-2sxc]");
    var modules = $("div[data-2sxc]");

    // Ensure the _processToolbar is called after the next event cycle to make sure that the Angular app (template selector) is loaded first
    window.setTimeout(function () {
        modules.each(function () {
            try {
                var moduleId = $(this).data("2sxc").moduleId;
                $2sxc(moduleId).manage._processToolbars();
            } catch (e) { // Make sure that if one app breaks, others continue to work
                if (console && console.error)
                    console.error(e);
            }
        });
    }, 0);

    window.EavEditDialogs = [];
});

(function () {
    var module = angular.module("2sxc.view", [
        "2sxc4ng",
        "pascalprecht.translate",
        "SxcInpageTemplates",
        "EavConfiguration"
    ]);

    module.config(["$translateProvider", "AppInstanceId", "$translatePartialLoaderProvider", "languages", function ($translateProvider, AppInstanceId, $translatePartialLoaderProvider, languages) {
        
        var globals = $2sxc(AppInstanceId).manage._manageInfo;
        
        // add translation table
        $translateProvider
            .preferredLanguage(languages.currentLanguage.split("-")[0])
            .useSanitizeValueStrategy("escapeParameters")   // this is very important to allow html in the JSON files
            .fallbackLanguage(languages.fallbackLanguage)
            .useLoader("$translatePartialLoader", {
                urlTemplate: languages.i18nRoot + "{part}-{lang}.js"
            })
            .useLoaderCache(true);

        $translatePartialLoaderProvider.addPart("inpage");
    }]);


})();
(function () {
    var module = angular.module("2sxc.view");

    module.factory("moduleApiService", ["$http", function($http) {
        return {

            saveTemplate: function (templateId, forceCreateContentGroup, newTemplateChooserState) {
                return $http.get("View/Module/SaveTemplateId", { params: {
                    templateId: templateId,
                    forceCreateContentGroup: forceCreateContentGroup,
                    newTemplateChooserState: newTemplateChooserState
                } });
            },

            addItem: function(sortOrder) {
                return $http.get("View/Module/AddItem", { params: { sortOrder: sortOrder } });
            },

            getSelectableApps: function() {
                return $http.get("View/Module/GetSelectableApps");
            },

            setAppId: function(appId) {
                return $http.get("View/Module/SetAppId", { params: { appId: appId } });
            },

            getSelectableContentTypes: function() {
                return $http.get("View/Module/GetSelectableContentTypes");
            },

            getSelectableTemplates: function() {
                return $http.get("View/Module/GetSelectableTemplates");
            },

            setTemplateChooserState: function(state) {
                return $http.get("View/Module/SetTemplateChooserState", { params: { state: state } });
            },

            renderTemplate: function(templateId) {
                return $http.get("View/Module/RenderTemplate", { params: { templateId: templateId } });
            },

            changeOrder: function(sortOrder, destinationSortOrder) {
                return $http.get("View/Module/ChangeOrder",
                { params: { sortOrder: sortOrder, destinationSortOrder: destinationSortOrder } });
            },

            publish: function(part, sortOrder) {
                return $http.get("view/module/publish", { params: { part: part, sortOrder: sortOrder } });
            },

            removeFromList: function(sortOrder) {
                return $http.get("View/Module/RemoveFromList", { params: { sortOrder: sortOrder } });
            }
        };
    }]);

})();
(function () {
    var module = angular.module("2sxc.view");

    module.controller("TemplateSelectorCtrl", ["$scope", "$attrs", "moduleApiService", "AppInstanceId", "sxc", "$filter", "$q", "$window", "$translate", function($scope, $attrs, moduleApiService, AppInstanceId, sxc, $filter, $q, $window, $translate) {
        //#region constants
        var cViewWithoutContent = "_LayoutElement"; // needed to differentiate the "select item" from the "empty-is-selected" which are both empty

        //#endregion

        var realScope = $scope;
        var svc = moduleApiService;
        var importCommand = $attrs.importappdialog; // note: ugly dependency, should find a way to remove
        var viewPortSelector = ".DnnModule-" + AppInstanceId + " .sc-viewport";

        //#region vm and basic values / variables attached to vm
        var vm = this;
        vm.apps = [];
        vm.contentTypes = [];
        vm.templates = [];

        vm.manageInfo = sxc.manage._manageInfo;
        vm.templateId = vm.manageInfo.templateId;
        vm.undoTemplateId = vm.templateId;
        vm.contentTypeId = (vm.manageInfo.contentTypeId === "" && vm.manageInfo.templateId !== null)
            ? cViewWithoutContent           // has template but no content, use placeholder
            : vm.manageInfo.contentTypeId;
        vm.undoContentTypeId = vm.contentTypeId;

        vm.appId = vm.manageInfo.appId;
        vm.savedAppId = vm.manageInfo.appId;

        vm.loading = 0;
        //#endregion


        vm.filteredTemplates = function (contentTypeId) {
            // Don't filter on App - so just return all
            if (!vm.manageInfo.isContentApp)
                return vm.templates;

            var condition = { ContentTypeStaticName: (contentTypeId === cViewWithoutContent) ? "" : contentTypeId };
            return $filter("filter")(vm.templates, condition, true);
        };


        vm.reloadTemplates = function() {

            vm.loading++;
            var getContentTypes = svc.getSelectableContentTypes();
            var getTemplates = svc.getSelectableTemplates();

            $q.all([getContentTypes, getTemplates])
                .then(function(res) {
                    vm.contentTypes = res[0].data;
                    vm.templates = res[1].data;

                    // Add option for no content type if there are templates without
                    if ($filter("filter")(vm.templates, { ContentTypeStaticName: "" }, true).length > 0) {
                        vm.contentTypes.push({ StaticName: cViewWithoutContent, Name: $translate.instant("TemplatePicker.LayoutElement") }); 
                        vm.contentTypes = $filter("orderBy")(vm.contentTypes, "Name");
                    }

                    vm.loading--;
                });
        };

        realScope.$watch("vm.templateId", function (newTemplateId, oldTemplateId) {
            if (newTemplateId === oldTemplateId)
                return;

            // Content (ajax, don't save the changed value)
            if (vm.manageInfo.isContentApp)
                return vm.renderTemplate(newTemplateId);

            // App
            vm.loading++;
            vm.persistTemplate(false)
                .then(function() { $window.location.reload(); });
        });

        // Auto-set view-dropdown if content-type changed
        realScope.$watch("vm.contentTypeId", function (newContentTypeId, oldContentTypeId) {
        	if (newContentTypeId == oldContentTypeId)
        		return;
        	// Select first template if contentType changed
        	var firstTemplateId = vm.filteredTemplates(newContentTypeId)[0].TemplateId; 
        	if (vm.templateId !== firstTemplateId && firstTemplateId !== null)
        		vm.templateId = firstTemplateId;
        });

        // Save/reload on app-change or show import-window
        realScope.$watch("vm.appId", function (newAppId, oldAppId) {
            if (newAppId === oldAppId || newAppId === null)
                return;

            if (newAppId === -1) {
                window.location = importCommand; // actually does a dnnModal.show...
                return;
            }

            svc.setAppId(newAppId).then(function() {
                $window.location.reload();
            });
        });

        // Cancel and reset back to original state
        vm.cancelTemplateChange = function() {
            vm.templateId = vm.undoTemplateId;
            vm.contentTypeId = vm.undoContentTypeId;
            vm.manageInfo.templateChooserVisible = false;
            svc.setTemplateChooserState(false);
            if (vm.manageInfo.isContentApp) // necessary to show the original template again
                vm.reloadTemplates();
        };

        // store the template state to the server, optionally force create of content, and hide the selector
        vm.persistTemplate = function(forceCreate, selectorVisibility) {
            // Save only if the currently saved is not the same as the new
            var groupExistsAndTemplateUnchanged = !!vm.manageInfo.hasContent && (vm.undoTemplateId === vm.templateId);
            var promiseToSetState;
            if (groupExistsAndTemplateUnchanged)
                promiseToSetState = (vm.manageInfo.templateChooserVisible)
                    ? svc.setTemplateChooserState(false) // hide in case it was visible
                    : $q.when(null); // all is ok, create empty promise to allow chaining the result
            else
                promiseToSetState = svc.saveTemplate(vm.templateId, forceCreate, selectorVisibility)
                    .then(function(result) {
                        if (result.status !== 200) { // only continue if ok
                            alert("error - result not ok, was not able to create ContentGroup");
                            return;
                        }
                        var newGuid = result.data;
                        if (newGuid === null)
                            return;
                        newGuid = newGuid.replace(/[\",\']/g, ""); // fixes a special case where the guid is given with quotes (dependes on version of angularjs) issue #532
                        if (console)
                            console.log("created content group {" + newGuid + "}");
                        sxc.manage._manageInfo.config.contentGroupId = newGuid; // update internal ContentGroupGuid 
                    });
            
            var promiseToCorrectUi = promiseToSetState.then(function() {
                    vm.undoTemplateId = vm.templateId;          // remember for future undo
                    vm.undoContentTypeId = vm.contentTypeId;    // remember ...
                    vm.manageInfo.templateChooserVisible = false;
                    if(!vm.manageInfo.hasContent)               // if it didn't have content, then it only has now...
                        vm.manageInfo.hasContent = forceCreate; // ...if we forced it to
            });

            return promiseToCorrectUi;
        };

        vm.renderTemplate = function (templateId) {
            vm.loading++;
            svc.renderTemplate(templateId).then(function (response) {
                try {
                    $(viewPortSelector).html(response.data);
                    sxc.manage._processToolbars();
                } catch (e) {
                    console.log("Error while rendering template:");
                    console.log(e);
                }
                vm.loading--;
            });
        };

        vm.show = function(stateChange) {
            if (stateChange !== undefined)
                vm.manageInfo.templateChooserVisible = stateChange;

            if (vm.appId !== null && vm.manageInfo.templateChooserVisible) 
                vm.reloadTemplates();
        };

        vm.toggle = function () {
            vm.manageInfo.someTest = "a value";
            if (vm.manageInfo.templateChooserVisible)
                vm.cancelTemplateChange();
            else {
                vm.show(true);
                svc.setTemplateChooserState(true);
            }
        };

        // reload by ajax or page, depeding on mode (used in toolbar)
        vm.reload = function () {
            if (!vm.templateId)
                return;

            if (vm.manageInfo.isContentApp)
                vm.renderTemplate(vm.templateId);
            else
                $window.location.reload();
        };

        //#region initialize this
        vm.show(); // show if it has to, or not

        // Init App-Dropdown if it's an app-selector
        if (!vm.manageInfo.isContentApp) {
            svc.getSelectableApps()
                .then(function(data) {
                    vm.apps = data.data;
                    vm.apps.push({ Name: $translate.instant("TemplatePicker.GetMoreApps"), AppId: -1 });
                });
        }

        //#endregion


        //#region commands for the toolbar like add, remove, publish, translate, ..
        // ToDo: Remove this here, as it's not used in TemplateSelector - should move to 2sxc.api.manage.js

        vm.prepareToAddContent = function () {
            return vm.persistTemplate(true, false);
        };

        vm.addItem = function(sortOrder) {
            svc.addItem(sortOrder).then(function () {
                vm.renderTemplate(vm.templateId);
            });
        };
        vm.removeFromList = function (sortOrder) {
        	svc.removeFromList(sortOrder).then(function () {
        		vm.renderTemplate(vm.templateId);
        	});
        };
        vm.changeOrder = function (sortOrder, desintationSortOrder) {
        	svc.changeOrder(sortOrder, desintationSortOrder).then(function () {
        		vm.renderTemplate(vm.templateId);
        	});
        };
        vm.publish = function(part, sortOrder) {
            svc.publish(part, sortOrder).then(function() {
                vm.renderTemplate(vm.templateId);
            });
        };
        vm.translate = function (key) { return $translate.instant(key); };
        //#endregion
    }]);


})();