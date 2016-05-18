'use strict';

var fs = require('fs')
var through = require('through2')
var path = require('path')
var CRMWebAPI = require('./CRMWebAPI');


var CRMWebResourceManager = (function () {
function CRMWebResourceManager() {
		
		return this;
	}
});
CRMWebResourceManager.Upload = function (config) {
		
        return through.obj(function(file, enc, cb) {
          
           var uniqueName = null;
           config.WebResources.forEach(function(wrconfig) {
              
               if (wrconfig.Path == path.relative(__dirname,file.path))
                 uniqueName = wrconfig.UniqueName;
           })
           if (uniqueName == null)
           {
               console.log('File Skiped - Not Configured : ' + path.relative(__dirname,file.path) );
               return cb();
           }
           var queryOption = {
            	Filter:"name  eq '"+ uniqueName +"'",
	            Select:['webresourceid'],   
            };
            var apiconfig = { APIUrl: config.Server, AccessToken: config.AccessToken };

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
                       var publishParms = {ParameterXml:"<importexportxml><webresources><webresource>{" + wrUpdate.webresourceid + "}</webresource></webresources></importexportxml>"}
                      
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
          
          
        });
    
 }

 


module.exports = CRMWebResourceManager;
