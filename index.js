'use strict';

var fs = require('fs')
var through = require('through2')
var path = require('path')
var CRMWebAPI = require('./CRMWebAPI');
var adal = require('adal-node');


var CRMWebResourceManager = (function () {
function CRMWebResourceManager() {
		
		return this;
	}
});

CRMWebResourceManager._Authenticate = function(config)
{
  return new Promise(function (resolve, reject) {
    var authorityHostUrl = config.AuthorityHost || 'https://login.windows.net/common';
    var clientId = '3e4ef8f4-24ba-4709-a60d-27ee21fdfba9';
  
    if (config.AccessToken != null)
    {
        resolve(config.AccessToken);
    }
    else
    {
				if (!config.Server) {
					reject("You must specify the CRM server");
				}
				var valid = (config.User && config.Password)
					|| (config.ClientID && config.ClientSecret);
        if (!valid)
            reject("You must provide User & Password or ClientID & ClientSecret if not providing a valid AccessToken");
        else
        {
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

CRMWebResourceManager.Upload = function (config) {
		
        return through.obj(function(file, enc, cb) {
          
           var normalizedPath = path.relative(__dirname.replace(
             path.join('node_modules', 'gulp-webresource'), ''),file.path);
           var uniqueName = null;
           config.WebResources.forEach(function(wrconfig) {
              
               if (wrconfig.Path == normalizedPath)
                 uniqueName = wrconfig.UniqueName;
           })
           if (uniqueName == null)
           {
               console.log('File Skipped - Not Configured : ' + normalizedPath);
               return cb();
           }
           var queryOption = {
            	Filter:"name  eq '"+ uniqueName +"'",
	            Select:['webresourceid'],   
            };
            CRMWebResourceManager._Authenticate(config).then(function(accessToken){
                
            var apiconfig = { APIUrl: config.Server + '/api/data/v8.0/', AccessToken: accessToken };

            var crmAPI = new CRMWebAPI(apiconfig);
            
            crmAPI.GetList('webresourceset', queryOption).then(function (queryResult)
            {
                if (queryResult.List.length > 0)
                {
                    var wrContent = file.contents.toString();
                 
                    var wrUpdate = {};
                    wrUpdate.webresourceid = queryResult.List[0].webresourceid;
                    wrUpdate.content = new Buffer(wrContent).toString('base64');
                    crmAPI.Update("webresourceset",wrUpdate.webresourceid,wrUpdate).then(function(){
                       console.log(uniqueName + " updated.")
                       var publishParms = {ParameterXml:"<importexportxml><webresources><webresource>{" + 
                                        wrUpdate.webresourceid + "}</webresource></webresources></importexportxml>"}
                      
                       crmAPI.ExecuteAction("PublishXml",publishParms).then(
                          function(){ 
                                console.log(uniqueName +" published.") 
                                return cb();
                            },
                          function(error){
                              console.log("Error publishing " + uniqueName +" Error:" + error);
                        
                              return cb();
                            })
                          
                      },function(error){
                        console.log("error updating " + uniqueName + "Error " + error );
                         return cb();
                    })
                    
                }
                else{
                    console.log(uniqueName + " Must be configured in CRM ")
                }
            }
            ,function(error)
            {	console.log(error);
            });
          },function(error)
          { 
						console.log(error);
              if (error.stack.indexOf('administrator has not consented') != -1)
                { 
                        console.log('administrator must visit http://bit.ly/1Vpj6O2 to consent to use first');	
                }
                else
                console.log(error)
          });

          
        });
    
 }

 


module.exports = CRMWebResourceManager;
