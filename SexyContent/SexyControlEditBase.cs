﻿using DotNetNuke.Entities.Modules;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ToSic.SexyContent
{
    /// <summary>
    /// Contains properties that all controls use that edit the current module's data (not global data like admin controls)
    /// It delivers a context that uses the current modules App and the current portal's Zone.
    /// </summary>
    public abstract class SexyControlEditBase : PortalModuleBase
    {
        private SexyContent _sexy;
        protected SexyContent Sexy
        {
            get
            {
                if (_sexy == null && ZoneId.HasValue && AppId.HasValue)
                    _sexy = new SexyContent(ZoneId.Value, AppId.Value);
                return _sexy;
            }
        }

        private SexyContent _sexyUncached;
        protected SexyContent SexyUncached
        {
            get
            {
                if (_sexyUncached == null && ZoneId.HasValue && AppId.HasValue)
                    _sexyUncached = new SexyContent(ZoneId.Value, AppId.Value, false);
                return _sexyUncached;
            }
        }

        protected int? ZoneId
        {
            get
            {
                return SexyContent.GetZoneID(PortalId);
            }
        }

        protected virtual int? AppId
        {
            get
            {
                if (IsContentApp)
                {
                    if (ZoneId.HasValue)
                        return SexyContent.GetDefaultAppId(ZoneId.Value);
                    else
                        return new int?();
                }

                // Get AppId from ModuleSettings
                var appIdString = Settings[SexyContent.AppIDString];
                int appId;
                if (appIdString != null && int.TryParse(appIdString.ToString(), out appId))
                    return appId;

                return null;
            }
            set
            {
                var moduleController = new ModuleController();
                if(value == 0 || !value.HasValue)
                    moduleController.DeleteModuleSetting(ModuleId, SexyContent.AppIDString);
                else
                    moduleController.UpdateModuleSetting(ModuleId, SexyContent.AppIDString, value.ToString());
            }
        }

        protected bool IsContentApp
        {
            get { return ModuleConfiguration.DesktopModule.ModuleName == "2sxc"; }
        }
    }
}