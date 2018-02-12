var webresource = require('../index')
var gulp = require('gulp')
var cache = require('gulp-cached');

var config = {
    Server:process.env.crmserver,
    User:process.env.crmuser,
    Password:process.env.crmpassword,
    NTLM: {
      Domain: 'YOURDOMAIN',
      Workstation: process.env.COMPUTERNAME
    },
    WebResources:[
      {
        Path: 'test\\TestWebResource\\TestWebResource1.js',
        UniqueName: 'ctc_TestWebResource3.js',
        Type: 'JavaScript',
        Solution: 'NoteFeed'
      },
      {
        Path: 'test\\TestWebResource\\TestWebResource2.1.js',
        UniqueName: 'dave_TestWebResource4.js',
        Type: 'JavaScript',
        Solution: 'NoteFeed'
      },
    ]
}

gulp.task('cachecurrent', function(){
    gulp.src('./**/*.js')
    .pipe(cache('uploadwr'))
});

gulp.task('upload', function(){
    gulp.src('./**/*.js')
    .pipe(cache('uploadwr'))
    .pipe(webresource.Upload(config, true));
});

gulp.task('watch', function() {
    gulp.watch('./**/*.js', ['upload']);
});

gulp.task('default', ['cachecurrent','watch']);
