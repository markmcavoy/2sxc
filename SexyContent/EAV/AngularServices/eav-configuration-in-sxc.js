﻿// EavGlobalConfigurationProvider providers default global values for the EAV angular system
// The ConfigurationProvider in 2sxc is not the same as in the EAV project.

// the following config-stuff is not in angular, because some settings are needed in dialogs which are not built with angularJS yet.
// they are included in the same file for conveniance and to motivate the remaining dialogs to get migrated to AngularJS

//$(function () {
    var todofilesRoot = "/desktopmodules/tosic_sexycontent/";
    window.$eavUIConfig = {
        // Get DNN ModuleContext
        // globals: $('div[data-2sxc-globals]').data('2sxc-globals'),

        baseUrl: function baseUrl() {
            alert("trying to use baseurl - deprecated");
            //return $eavUIConfig.globals.FullUrl + '?mid=' + $eavUIConfig.globals.ModuleContext.ModuleId + '&popUp=true&AppId=' + $eavUIConfig.globals.ModuleContext.AppId + '&';
        },

        urls: {
            exportContent: function (appId) {
                return "/todo?appId=" + appId;
            },
            importContent: function (appId) {
                return "/todo?appId=" + appId;
            },
            ngRoot: function () {
                return "/dist/";
            },
            pipelineDesigner: function (appId, pipelineId) {
                return "/Pages/ngwrapper.cshtml?ng=pipeline-designer&AppId=" + appId + "&pipelineId=" + pipelineId;
                //return '/Pages/ngwrapper.aspx?AppId=' + appId + '&PipelineId=' + pipelineId;
            }
        },
        languages: {
            languages: [{ key: "en-us", name: "English (United States)" }, { key: "de-de", name: "Deutsch (Deutschland)" }],
            defaultLanguage: "en-us",
            currentLanguage: "en-us",
            i18nRoot: todofilesRoot + "dist/i18n/"
        }


    };
//});

if (window.angular) // needed because the file is also included in older non-angular dialogs
    angular.module("EavConfiguration", [])
        .constant("languages", window.$eavUIConfig.languages)
        .factory("eavConfig", function ($location) {

            var dnnModuleId = $location.search().mid;
        //// Get DNN ModuleContext
        //var globals = $('div[data-2sxc-globals]').data('2sxc-globals');
        //if (!globals)
        //    alert('Please ensure the DNN-Page is in Edit-Mode');

        //var getApiAdditionalHeaders = function () {
        //    var sf = $.ServicesFramework(globals.ModuleContext.ModuleId);

        //    return {
        //        ModuleId: sf.getModuleId(),
        //        TabId: sf.getTabId(),
        //        RequestVerificationToken: sf.getAntiForgeryValue()
        //    };
        //}

        //var baseUrl = globals.FullUrl + '?mid=' + globals.ModuleContext.ModuleId + '&popUp=true&AppId=' + globals.ModuleContext.AppId + '&';

        //var getItemFormUrl = function (mode, params, preventRedirect) {
        //    if (mode == 'New')
        //        params.editMode = 'New';
        //    if (!params.ReturnUrl)
        //        params.ReturnUrl = $location.url();
        //    if (preventRedirect)
        //        params.PreventRedirect = true;
        //    if (typeof globals.DefaultLanguageID == 'number')
        //        params.cultureDimension = globals.DefaultLanguageID;
        //    return baseUrl + 'ctl=editcontentgroup&' + $.param(params);
        //};

        return {
            //api: {
            //    baseUrl: globals.ApplicationPath + 'DesktopModules/2sxc/API',
            //    // additionalHeaders: getApiAdditionalHeaders(),
            //    defaultParams: {
            //        portalId: globals.ModuleContext.PortalId,
            //        moduleId: globals.ModuleContext.ModuleId,
            //        tabId: globals.ModuleContext.TabId
            //    }
            //},
            dialogClass: "dnnFormPopup",
            itemForm: {
                getNewItemUrl: function (attributeSetId, assignmentObjectTypeId, params, preventRedirect, prefill) {
                    if (prefill)
                        params.prefill = JSON.stringify(prefill);
                    return getItemFormUrl("New", angular.extend({ AttributeSetId: attributeSetId, AssignmentObjectTypeId: assignmentObjectTypeId }, params), preventRedirect);
                },
                getEditItemUrl: function (entityId, params, preventRedirect) {
                    return getItemFormUrl("Edit", angular.extend({ EntityId: entityId }, params), preventRedirect);
                }
            },
            adminUrls: {
                managePermissions: function (appId, targetId) {
                    return $eavUIConfig.urls.managePermissions(appId, targetId); //$eavUIConfig.baseUrl() + "ctl=permissions&Target=" + targetId;
                }
            },
            pipelineDesigner: {
                getUrl: function (appId, pipelineId) {
                    return baseUrl + "ctl=pipelinedesigner&PipelineId=" + pipelineId;
                },
                outDataSource: {
                    className: "SexyContentTemplate",
                    in: ["ListContent", "Default"],
                    //in: ['ListPresentation', 'Presentation', 'ListContent', 'Default'],
                    name: "2sxc Target (View or API)",
                    description: "The template/script which will show this data",
                    visualDesignerData: { Top: 20, Left: 420 }
                },
                defaultPipeline: {
                    dataSources: [
                        {
                            entityGuid: "unsaved1",
                            partAssemblyAndType: "ToSic.Eav.DataSources.Caches.ICache, ToSic.Eav",
                            visualDesignerData: { Top: 800, Left: 440 }
                        },
                        {
                            entityGuid: "unsaved2",
                            partAssemblyAndType: "ToSic.Eav.DataSources.PublishingFilter, ToSic.Eav",
                            visualDesignerData: { Top: 620, Left: 440 }
                        },
                        {
                            entityGuid: "unsaved3",
                            partAssemblyAndType: "ToSic.SexyContent.DataSources.ModuleDataSource, ToSic.SexyContent",
                            visualDesignerData: { Top: 440, Left: 440 }
                        }
                    ],
                    streamWiring: [
                        { From: "unsaved1", Out: "Default", To: "unsaved2", In: "Default" },
                        { From: "unsaved1", Out: "Drafts", To: "unsaved2", In: "Drafts" },
                        { From: "unsaved1", Out: "Published", To: "unsaved2", In: "Published" },
                        { From: "unsaved2", Out: "Default", To: "unsaved3", In: "Default" },
                        //{ From: 'unsaved3', Out: 'ListPresentation', To: 'Out', In: 'ListPresentation' },
                        { From: "unsaved3", Out: "ListContent", To: "Out", In: "ListContent" },
                        //{ From: 'unsaved3', Out: 'Presentation', To: 'Out', In: 'Presentation' },
                        { From: "unsaved3", Out: "Default", To: "Out", In: "Default" }
                    ]
                },
                testParameters: "[Module:ModuleID]=" + dnnModuleId // globals.ModuleContext.ModuleId
            },
            metadataOfEntity: 4,
            metadataOfAttribute: 2,

            contentType: {
                defaultScope: "2SexyContent",
                template: "2SexyContent-Template"
            }

        }
    });