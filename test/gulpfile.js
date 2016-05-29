var webresource = require('../index')
var gulp = require('gulp')
var cache = require('gulp-cached');

var config = {
    Server:process.env.crmserver,
    User:process.env.crmuser,
    Password:process.env.crmpassword,
    Accesstoken:null,
    WebResources:[
     { Path:'test\\TestWebResource\\TestWebResource1.js',UniqueName:'ctc_TestWebResource1.js' },
     { Path:'test\\TestWebResource\\TestWebResource2.js',UniqueName:'dave_TestWebResource2.js' },
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
