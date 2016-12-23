'use strict';
var fs = require('fs')
var through = require('through2')
var path = require('path')
var CRMWebAPI = require('./CRMWebAPI');
var adal = require('adal-node');

var CRMWebResourceManager = (function() {
  function CRMWebResourceManager() {
    return this;
  }
});

function getWebResourceType(type) {
  switch (type) {
    case 'HTML':
      return 1;
		case 'CSS':
			return 2;
		case 'JavaScript':
			return 3;
		case 'XML':
			return 4;
		case 'PNG':
			return 5;
		case 'JPG':
			return 6;
		case 'GIF':
			return 7;
		case 'XAP':
			return 8;
		case 'XSL':
			return 9;
		case 'ICO':
			return 10;
		default:
			return null;
  }
}

CRMWebResourceManager._Authenticate = function(config) {
  return new Promise(function (resolve, reject) {
    var authorityHostUrl = config.AuthorityHost || 'https://login.windows.net/common';
    var clientId = config.ClientID || '3e4ef8f4-24ba-4709-a60d-27ee21fdfba9';
  
    if (config.AccessToken != null) {
        resolve(config.AccessToken);
    } else {
      if (!config.Server) {
        reject("You must specify the CRM server");
      }
      var valid = (config.User && config.Password)
        || (config.ClientID && config.ClientSecret);
      if (!valid) {
        reject("You must provide User & Password or ClientID & ClientSecret if not providing a valid AccessToken");
      } else {
        function handleToken(err, tokenResponse) {
          if (err) {
            reject(err);
          } else {
            resolve(tokenResponse.accessToken);
          }
        };
        var context = new adal.AuthenticationContext(authorityHostUrl);
        if (config.ClientID && config.ClientSecret) {
          context.acquireTokenWithClientCredentials(config.Server, config.ClientID, config.ClientSecret, handleToken);
        } else {
          context.acquireTokenWithUsernamePassword(config.Server, config.User, config.Password, clientId, handleToken);
        }
      }
    }
  });
}

CRMWebResourceManager.Upload = function (config, register) {
  if (typeof register === 'undefined') {
    register = false;
  }

  return through.obj(function(file, enc, cb) {
		var normalizedPath = path.relative(__dirname.replace(
			path.join('node_modules', 'gulp-webresource'), ''),file.path);
    var wrconfig = null;
		config.WebResources.forEach(function(wrc) {
		  if (wrc.Path == normalizedPath)
        wrconfig = wrc;
		});
		if (wrconfig == null) {
		 console.log('File Skipped - Not Configured : ' + normalizedPath);
		 return cb();
		}
		var queryOption = {
		 Filter: "name  eq '" + wrconfig.UniqueName + "'",
		 Select: [ 'webresourceid' ],   
		};

		CRMWebResourceManager._Authenticate(config).then(function(accessToken) {
      var apiconfig = {
        APIUrl: config.Server + '/api/data/v' + (config.ApiVersion || '8.0') + '/',
        AccessToken: accessToken
      };
      var crmAPI = new CRMWebAPI(apiconfig);

      crmAPI.GetList('webresourceset', queryOption).then(function(queryResult) {
        var wrContent = file.contents.toString();
        var wrUpdate = {};
        wrUpdate.content = new Buffer(wrContent).toString('base64');

        function internalcb(id) {
         console.log(wrconfig.UniqueName + (id ? " created." : " updated."));
         id = id || wrUpdate.webresourceid;
         var publishParms = {
           ParameterXml: "<importexportxml><webresources><webresource>{" + 
             id + "}</webresource></webresources></importexportxml>"
         };
         
         crmAPI.ExecuteAction("PublishXml", publishParms).then(function() { 
           console.log(wrconfig.UniqueName +" published.") 
           return cb();
         }, function(error) {
           console.log("Error publishing " + wrconfig.UniqueName +" Error:", error);
           return cb();
         });
        }

        if (queryResult.List.length > 0) {
         wrUpdate.webresourceid = queryResult.List[0].webresourceid;
         crmAPI.Update("webresourceset", wrUpdate.webresourceid, wrUpdate)
           .then(function() { internalcb(); }, function(error) {
             console.log("error updating " + wrconfig.UniqueName + "Error ", error);
             return cb();
           });
        } else if (register) {
          wrUpdate.webresourcetype = getWebResourceType(wrconfig.Type);
          wrUpdate.name = wrconfig.UniqueName;
          wrUpdate.displayname = wrconfig.DisplayName || wrconfig.UniqueName;
         crmAPI.Create("webresourceset", wrUpdate)
           .then(internalcb, function(error) {
             console.log("error updating " + wrconfig.UniqueName + "Error ", error);
             return cb();
           });
        } else {
         console.log(wrconfig.UniqueName + " does not exist, refusing to register");
         return cb();
        }
      }, console.log);
    }, function(error) { 
      if (error.stack && error.stack.indexOf('administrator has not consented') != -1)
        console.log('administrator must visit http://bit.ly/1Vpj6O2 to consent to use first');	
      else
        console.log(error);
		});
  });
}

module.exports = CRMWebResourceManager;
