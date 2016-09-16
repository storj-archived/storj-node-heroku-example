var express = require('express');
var fs = require('fs');
var async = require('async');
var app = express();
var utils = require('./lib/utils');
var path = require('path');
var STORJ_EMAIL = process.env.STORJ_EMAIL;
var STORJ_PASSWORD = process.env.STORJ_PASSWORD;
var KEYRING_PASSWORD = 'mykeyringpassword';
var localAssetsDir = __dirname + '/public';
var fileMap = {};

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');


var storjOptions = {
  basicauth: {
    email: STORJ_EMAIL,
    password: STORJ_PASSWORD,
    concurrency: 6
  }
};

// Log into bridge
utils.getBasicAuthClient(storjOptions, function(client) {
  console.log('Got Storj client');

  // Create a bucket for our files
  console.log('Creating bucket %s', 'assets');
  utils.createBucket(client, 'assets', function(bucketId) {
    console.log('Bucket created with ID %s', bucketId);

    // Get all of our local assets
    fs.readdir(localAssetsDir, function(err, files) {
      console.log('Got file list to upload: ', files);
      // Loop through assets and upload each of them
      async.eachSeries(files, function(file, callback) {
        // need to get the name of the file out of the path here
        var filePath = path.join(localAssetsDir, file);
        var isFile = ( fs.lstatSync(filePath).isFile() );

        if (isFile) {
          utils.uploadFile(client, bucketId, filePath, KEYRING_PASSWORD, function(err, fileId) {
            console.log('Uploaded file: ', fileId);

            // Add each of our files to the filemap so we can retrieve them later
            fileMap[file.name] = {
              bucketId: bucketId,
              fileId: fileId
            };

            return callback();
          });
        }
      });
    });
  });
});

app.get('/', function(request, response) {
  response.render('pages/index', { STORJ_EMAIL: STORJ_EMAIL, STORJ_PASSWORD: STORJ_PASSWORD });
});

app.get('/:bucketname/:filename', function(request, response) {
  var bucketname = request.params.bucketname;
  var filename = request.params.filename;
  var fileOptions = {
    filename: filename,
    bucketname: bucketname,
    password: KEYRING_PASSWORD
  };

  utils.getBasicAuthClient(storjOptions, function(client) {
    utils.getFileStreamByName(client, fileOptions, function(err, fileStream, decrypter) {
      if (err) {
        return console.log('Error getting file stream: ', err);
      }

      console.log('Returning file to request');

      var imgMime;
      switch (fileOptions.filename.toLowerCase().slice(-4))
      {
        case ".bmp":              imgMime = "bmp";     break;
        case ".gif":              imgMime = "gif";     break;
        case ".jpg": case "jpeg": imgMime = "jpeg";    break;
        case ".png": case "apng": imgMime = "png";     break;
        case ".svg": case "svgz": imgMime = "svg+xml"; break;
        case ".tif": case "tiff": imgMime = "tiff";    break;
        default: console.log("File does not appear to be an image: " + fileName); return;
      }

      if (imgMime) {
        console.log('File type found - %s', imgMime);
        response.writeHead(200, {'Content-Type': 'image/' + imgMime});
      }

      if (!imgMime) {
        console.log("File type unknown");
      }

      //fileStream.resume();
      fileStream.pipe(decrypter).pipe(response);
    });
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
