# gulp-webresource

This is designed to be used as a gulp task for working with Dynamics CRM web resources.

Currently there is support for upload and publish, this can be used to automate your client development work flow of CRM web resources.

The gulp task takes configuration information that provides mapping from file to CRM web resoure.  

For authentication the gulp task just wants a CRM OAuth access token, it doesn't care how you got it.  So you can use https://xrm.tools/Accesstoken to get it, or use adal.js to do it from within your gulp flow 
