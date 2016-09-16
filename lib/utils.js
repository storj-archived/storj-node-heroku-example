'use strict';

var fs = require('fs');
var path = require('path');
var storj = require('storj');
var bridgeEmail = process.env.STORJ_EMAIL;
var bridgePass = process.env.STORJ_PASSWORD;
var dataDir = process.env.DATA_DIR || __dirname + '/.storjcli';
var bridgeURL = process.env.BRIDGE_URL || 'https://api.storj.io';

var createDataDir = function(dir, callback) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    return callback();
  }

  callback();
};

var getFilenameIndex = function(client, bucketId, callback) {
  client.listFilesInBucket(bucketId, function(err, files) {
    if (err) {
      return console.log('Error listing files in bucket: ', err);
    }

    if (!files || files.length === 0) {
      console.log('No files in bucket');
      return callback([]);
    }

    var count = 0;
    var fileCount = files.length;
    var fileNameIndex = [];

    while ( count < fileCount ) {
      var file = files[count];
      fileNameIndex[file.filename] = file;

      count++;

      if (count == fileCount) {
        callback(fileNameIndex);
      }
    }
  });
};

var getBucketList = function(client, callback) {
  client.getBuckets(function(err, buckets) {
    if (err) {
      return console.log('error', err.message);
    }

    if (!buckets.length) {
      return console.log('warn', 'I can\'t seem to find any buckets...');
    }

    return callback(buckets);
  });
};

var createBucketnameIndex = function(buckets, callback) {
  var bucketnameIndex = {};

  buckets.forEach(function(bucket) {
    bucketnameIndex[bucket.name] = bucket.id;
  });

  return callback(bucketnameIndex);
};

var getKeyRing = function(password, callback) {

  // Check to make sure dataDir exists and create it if it doesnt
  console.log('Creating data dir');
  createDataDir(dataDir, function() {
    console.log('Creating key ring');
    try {
      var keyring = storj.KeyRing(dataDir, password);
    } catch(err) {
      return console.log('Error creating keyring: %s', err);
    }
    console.log('Key ring created');
    return callback(keyring);
  });
};

var createBucket = function(client, name, callback) {
  var bucketInfo = {
    name: name,
    storage: 30,
    transfer: 10
  };

  console.log('Attempting to create bucket \'%s\'', name);

  client.createBucket(bucketInfo, function(err, bucket) {
    if (err) {
      return console.log('error', err.message);
    }

    return callback(bucket.id);
  });
};

var uploadFile = function(client, bucketId, filePath, password, callback) {
  // Prepare to encrypt file for upload
  var tmppath = filePath + '.crypt';
  var secret = new storj.DataCipherKeyIv();
  var encrypter = new storj.EncryptStream(secret);
  var writeStream = fs.createWriteStream(tmppath, { autoClose: true });

  console.log('Uploading file ', filePath);

  fs.createReadStream(filePath).pipe(encrypter).pipe(writeStream);

  getKeyRing(password, function(keyring) {
    writeStream.on('finish', function() {
      client.createToken(bucketId, 'PUSH', function(err, token) {
        if (err) {
          return console.log('Error getting token: %s', err);
        }

        console.log('Created token');
        console.log('Storing file in bucket');

        client.storeFileInBucket(bucketId, token.token, tmppath, function(err, file) {
          if (err) {
            return console.log('Error storing file in bucket: %s', err);
          }

          console.log('File uploaded...');

          keyring.set(file.id, secret);
          return callback(null, file.id);
        });
      });
    });
  });
};

var getDecrypter = function(fileId, password, callback) {
  getKeyRing(password, function(keyring) {
    var secret = keyring.get(fileId);
    var decrypter = new storj.DecryptStream(secret);

    callback(decrypter);
  });
};

var getFileStreamByName = function(client, options, callback) {
  var filename = options.filename;
  var bucketname = options.bucketname;
  var password = options.password;

  // Get the bucketid
  getBucketList(client, function(bucketList) {
    // Get the fileid
    createBucketnameIndex(bucketList, function(bucketnameIndex) {
      console.log('bucketnameIndex is: ', bucketnameIndex);

      var bucketId = bucketnameIndex[bucketname];

      console.log('bucketId is: ', bucketId);

      // get the file stream
      getFilenameIndex(client, bucketId, function(filenameIndex) {
        console.log('filenameIndex is: ', filenameIndex);
        console.log('filename is: ', filename);

        if (!filenameIndex || !filenameIndex[filename]) {
          return callback('File not found');
        }

        var fileId = filenameIndex[filename].id;

        console.log('fileId is: ', fileId);

        getDecrypter(fileId, password, function(decrypter) {
          // decrypt the file
          console.log('Got decrypter, creating file stream');
          client.createFileStream(bucketId, fileId, function(err, stream) {
            if (err) {
              console.log('Error creating file stream: ', err);
              return callback(err);
            }
            console.log('file steram created, returning callback');
            stream.pause();

            return callback(null, stream, decrypter);
          });
        });
      });
    });
  });
};


var getBasicAuthClient = function(options, callback) {
  var logger = storj.deps.kad.Logger();
  // Change to 1-4 to see logs from Storj
  // 4 being the highest level of logging
  logger.level = 4;
  options.logger = logger;
  var client = new storj.BridgeClient(bridgeURL, options);
  console.log('Created Storj client');

  console.log('This device has been successfully paired.');
  return callback(client);
};

module.exports = {
  getBucketList: getBucketList,
  createBucketnameIndex: createBucketnameIndex,
  getFilenameIndex: getFilenameIndex,
  createBucket: createBucket,
  uploadFile: uploadFile,
  getFileStreamByName: getFileStreamByName,
  getBasicAuthClient: getBasicAuthClient
};
