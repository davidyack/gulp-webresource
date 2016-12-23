# gulp-webresource

This is designed to be used as a gulp task for working with Dynamics 365 web resources.

Currently there is support for upload and publish, this can be used to automate your client development work flow of CRM web resources.

The gulp task takes configuration information that provides mapping from file to CRM web resoure.  

For authentication the gulp task can use either user/password or ClientId/Secret via the new Server to Server authentication (https://msdn.microsoft.com/en-us/library/mt790168.aspx). Or you can provide your own access token, it doesn't care how you got it.  So you can use https://xrm.tools/Accesstoken to get it, or use adal.js to do it from within your gulp flow  

When used in combination with watch and a cache task - you can configure the gulpfile to watch for changes in web resources and only upload those that have changed.  Look at the gulp file in ./tests for an example

Upload function can now optionally create the web resource if not already in the target.  Use Update(config,true) instead of update(config,false) to enable registration of any newly configured web resources.  If you are using this option you need to include DisplayName and Type

All feedback is welcome!

####To use install via npm
````
npm install gulp-webresource --save-dev
````

####Step By Step
1) Create a new folder for your project

2) Install gulp, gulp-cached and gulp-webresource
````
npm install gulp --save-dev
npm install gulp-cached --save-dev
npm install gulp-webresource --save-dev
````

3) Create a gulfile.js with the following contents
````
var webresource = require('gulp-webresource')
var gulp = require('gulp')
var cache = require('gulp-cached');

var config = {
    Server:process.env.crmserver,
    User:process.env.crmuser,
    Password:process.env.crmpassword,
    AccessToken:null,
    WebResources:[
     { Path:'TestWebResource\\TestWebResource1.js',UniqueName:'ctc_TestWebResource1.js' },
     { Path:'TestWebResource\\TestWebResource2.js',UniqueName:'ctc_TestWebResource2.js' },
    ]
}

gulp.task('cachecurrent', function(){
    gulp.src('./**/*.js')
    .pipe(cache('uploadwr'))
});

gulp.task('upload', function(){
    gulp.src('./**/*.js')
    .pipe(cache('uploadwr'))
    .pipe(webresource.Upload(config));
});

gulp.task('watch', function() {
    gulp.watch('./**/*.js', ['upload']);
});

gulp.task('default', ['cachecurrent','watch']);

````

4) Customize gulpfile.js WebResources list to include your web resources

5) Set environment variables for crmserver,crmuser,crmpassword
````
set crmserver=https://orgname.crm.dynamics.com
set crmuser=useremail
set crmpassword=userpwd
````

6) Administrator must consent to allowing the task to talk to CRM - navigate to the following link, this will prompt for administrator login and then will ask it to agree to allow gulp-webresource to talk to your CRM
````
 http://bit.ly/1Vpj6O2
````

7) Run gulp, and then go change a file and watch it upload it
