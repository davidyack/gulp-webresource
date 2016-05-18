var webresource = require('../index')
var gulp = require('gulp')
var cache = require('gulp-cached');

var config = {
    Server:'https://orgname.crm.dynamics.com/api/data/v8.0/',
    AccessToken:'',
    WebResources:[
     { Path:'test\\TestWebResource\\TestWebResource1.js',UniqueName:'ctc_TestWebResource1.js' },
     { Path:'test\\TestWebResource\\TestWebResource2.js',UniqueName:'dave_TestWebResource2.js' },
    ]
}
console.log("AccessToken:" + process.env.webresourceaccesstoken);

gulp.task('cachecurrent', function(){
    gulp.src('./TestWebResource/*.js')
    .pipe(cache('uploadwr'))
});

gulp.task('upload', function(){
    gulp.src('./**/*.js')
    .pipe(cache('uploadwr'))
    .pipe(webresource.Upload(config));
});

gulp.task('watch', function() {
    gulp.watch('./TestWebResource/*.js', ['upload']);
});

gulp.task('default', ['cachecurrent','watch']);
