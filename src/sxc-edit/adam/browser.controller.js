﻿(function () {
    /* jshint laxbreak:true */
    "use strict";

    var app = angular.module("Adam"); 

    // The controller for the main form directive
    app.controller("BrowserController", BrowserController);
    
    function BrowserController($scope, adamSvc, debugState, eavConfig, eavAdminDialogs, appRoot) {
        var vm = this;
        vm.debug = debugState;
        vm.contentTypeName = $scope.contentTypeName;
        vm.entityGuid = $scope.entityGuid;
        vm.fieldName = $scope.fieldName;
        vm.show = false;
        vm.subFolder = $scope.subFolder || "";
        vm.appRoot = appRoot;

        //$scope.showImagesOnly = ;
        vm.showImagesOnly = $scope.showImagesOnly = $scope.showImagesOnly || false;

        vm.folderDepth = (typeof $scope.folderDepth !== 'undefined' && $scope.folderDepth !== null)
            ? $scope.folderDepth
            : 2;
        vm.showFolders = !!vm.folderDepth;
        vm.allowAssetsInRoot = $scope.allowAssetsInRoot || true;
        vm.folderMetadataContentType = $scope.folderMetadataContentType || "";
        vm.metadataContentType = $scope.metadataContentType || "";
        vm.defaultMetadataContentType = vm.metadataContentType.split("\n")[0]; // first line is the rule for all


        vm.disabled = $scope.ngDisabled;
        vm.enableSelect = $scope.enableSelect || true;

        vm.activate = function () {
            if($scope.autoLoad)
                vm.toggle();
            if ($scope.registerSelf)
                $scope.registerSelf(vm);
        };


        // load svc...
        vm.svc = adamSvc(vm.contentTypeName, vm.entityGuid, vm.fieldName, vm.subFolder);

        // refresh - also used by callback after an upload completed
        vm.refresh = vm.svc.liveListReload;

        vm.get = function () {
            vm.items = vm.svc.liveList();
            vm.folders = vm.svc.folders;
        };

        vm.toggle = function toggle(newConfig) {
            var settingsChanged = false;
            if (newConfig) {
                settingsChanged = (vm.showImagesOnly !== newConfig.showImagesOnly);
                vm.showImagesOnly = newConfig.showImagesOnly;
            }
            vm.show = settingsChanged || !vm.show;      // if settings changed, always show
            if (vm.show)
                vm.get();
        };

        vm.openUpload = function() {
            vm.dropzone.openUpload();
        };

        vm.select = function (fileItem) {
            if (vm.disabled || !vm.enableSelect)
                return;
            $scope.updateCallback(fileItem);
        };

        vm.addFolder = function () {
            if (vm.disabled)
                return;
            var folderName = window.prompt("Folder Name?");
            if (folderName)
                vm.svc.addFolder(folderName)
                    .then(vm.refresh);
        };

        vm.del = function del(item) {
            if (vm.disabled)
                return;
            var ok = window.confirm("delete ok?");
            if (ok)
                vm.svc.delete(item);
        };

        //#region Folder Navigation
        vm.goIntoFolder = function (folder) {
            var subFolder = vm.svc.goIntoFolder(folder);
            vm.subFolder = subFolder;
        };

        vm.goUp = function () {
            vm.subFolder = vm.svc.goUp();
        };

        vm.currentFolderDepth = function() {
            return vm.svc.folders.length;
        };

        vm.allowCreateFolder = function() {
            return vm.svc.folders.length < vm.folderDepth;
        };

        //#endregion

        //#region Metadata
        vm.editFolderMetadata = function(item) {
            var items = [
                vm._itemDefinition(item, vm.folderMetadataContentType)
            ];

            eavAdminDialogs.openEditItems(items, vm.refresh);

        };

        // todo: move to service, shouldn't be part of the application
        vm._itemDefinition = function (item, metadataType) {
            var title = "Metadata"; // todo: i18n
            return item.MetadataId !== 0
                ? { EntityId: item.MetadataId, Title: title } // if defined, return the entity-number to edit
                : {
                    ContentTypeName: metadataType, // otherwise the content type for new-assegnment
                    Metadata: {
                        Key: (item.Type === "folder" ? "folder" : "file") + ":" + item.Id,
                        KeyType: "string",
                        TargetType: eavConfig.metadataOfCmsObject
                    },
                    Title: title,
                    Prefill: { EntityTitle: item.Name } // possibly prefill the entity title 
                };

        };

        //#endregion

        //#region icons
        vm.icons = {
            doc: "file-word",
            docx: "file-word",
            xls: "file-excel",
            xlsx: "file-excel",
            ppt: "file-powerpoint",
            pptx: "file-powerpoint",
            pdf: "file-pdf",
            mp3: "file-audio",
            avi: "file-video",
            mpg: "file-video",
            mpeg: "file-video",
            mov: "file-video",
            mp4: "file-video",
            zip: "file-archive",
            rar: "file-archive",
            txt: "file-text",
            html: "file-code",
            css: "file-code",
            xml: "file-code",
            xsl: "file-code",
            vcf: "user"

        };
        vm.icon = function (item) {
            var ext = item.Name.substr(item.Name.lastIndexOf(".") + 1).toLowerCase();
            return "icon-" + (vm.icons[ext] || "file");
        };
        //#endregion

        vm.activate();
    }

})();