var express = require('express');
var app = express();
var fs = require('fs');
var async = require('async');
var bodyParser = require('body-parser');
var through = require('through');
var path = require('path');
var localAssetsDir = __dirname + '/public';
require('dotenv').config();

// Storj variables
var STORJ_EMAIL = process.env.STORJ_EMAIL;
var STORJ_PASSWORD = process.env.STORJ_PASSWORD;
var STORJ_MNEMONIC = process.env.STORJ_MNEMONIC || getMnemonic();
var storjCredentials = {
  email: STORJ_EMAIL,
  password: STORJ_PASSWORD
};

var storj = require('storj-lib');
var storj_utils = require('storj-lib/lib/utils');
var api = 'https://api.storj.io';
var client;
var KEYRING_PASS = 'somepassword';
var keyring = storj.KeyRing('./', KEYRING_PASS);
/*
  Get and/or generate mnemonic for you on load.
  !! Important: you'll need to manually
  add the contents of the file in the key.ring directory to your Heroku
  config variables either through the GUI or the command line
  `heroku config:set STORJ_MNEMONIC=<FILECONTENTS>

  You'll also need to add it to your .env file. Make sure it is the same
  name as what you set your heroku config to i.e.g if you call it STORJ_MNEMONIC then make sure you use that name consistently
*/

console.log('mnemonic', STORJ_MNEMONIC)

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* Endpoints */

app.get('/user/retrieve', function(req, res) {
  console.log('Retrieving basic auth credentials');
  res.status(200).send(storjCredentials);
});

app.get('/user/authenticate/user-pass', function(req, res) {
  if (!STORJ_EMAIL || !STORJ_PASSWORD) {
    return res.status(400).send('No credentials. Make sure you have a .env file with KEY=VALUE pairs')
  }
  client = storj.BridgeClient(api, { basicAuth: storjCredentials });
  console.log('Logged in with basic auth');
  res.status(200).send('successful');
});

app.get('/keypair/generate', function(req, res) {
  if (process.env.STORJ_PRIVATE_KEY) {
    console.log('Private key already exists');
    return res.status(400).send('duplicate');
    // You can actually make as many private keys as you want, but we're just
    // going to restrict ourselves to one for simplicity
  }
  // Generate keypair
  var keypair = storj.KeyPair();
  console.log('Generating Storj keypair');

  if (!client) {
    return res.status(400).send('No authentication. Make sure to authenticate with Basic Authentication first.');
  }

  // Add the keypair public key to the user account for Authentication
  client.addPublicKey(keypair.getPublicKey(), function() {
    // Save the private key for using to login later
    fs.appendFileSync('./.env', `STORJ_PRIVATE_KEY=${keypair.getPrivateKey()}`);
    // fs.writeFileSync('./private.key', keypairpair.getPrivateKey());

    // Send back sucess to client
    res.status(200).send(keypair.getPublicKey());
  });
});

app.get('/keypair/retrieve', function(req, res) {
  if (!client) {
    return res.status(400).send('No authentication. Make sure to authenticate with Basic Authentication or Key Pair authentication (if you have already generated a key pair).');
  }

  console.log('Getting public keys');

  client.getPublicKeys(function(err, keys) {
    if (err) {
      return console.log('error', err.message);
    }

    // Print out each key
    keys.forEach(function(key) {
      console.log('key info', key);
    });

    // Send back key pair info to client
    res.status(200).send(keys);
  })
});

app.get('/keypair/authenticate', function(req, res) {
  // Load key pair from saved private key
  var privateKey = process.env.STORJ_PRIVATE_KEY;

  console.log('privateKey: ', privateKey)

  var keypair = storj.KeyPair(privateKey);

  // Login using the keypair
  client = storj.BridgeClient(api, { keyPair: keypair });
  console.log('Logged in with keypair');
  res.status(200).send('successful');
});

app.post('/buckets/create', function(req, res) {
  // Settings for bucket
  var bucketInfo = {
    name: req.body.name
  };

  // Create bucket
  client.createBucket(bucketInfo, function(err, bucket) {
    if (err) {
      return console.log('error', err.message);
    }
    console.log('Created bucket', bucket);
    res.status(200).send(bucket);
  });
});

app.get('/buckets/list', function(req, res) {
  client.getBuckets(function(err, buckets) {
    if (err) {
      return console.log('error', err.message);
    }
    console.log('Retrieved buckets', buckets);
    res.status(200).send(buckets);
  });
});

app.get('/files/upload', function(req, res) {
  // encrypt the file
  // use deterministic key
  // use mnemonic as the password and bucketId as the salt
  client.getBuckets(function(err, buckets) {
    if (err) {
      return console.error(err.message);
    }
    console.log('buckets', buckets)
    // Use the first bucket
    var bucketId = buckets[0].id;
    console.log('bucketI', bucketId);
    console.log('Uploading file to', bucketId);

    // Select the file to be uploaded
    var filepath = './public/grumpy.jpg';
    var filename = 'grumpy.jpg';

    var tmppath = filepath + '.crypt';

    var filekey = _getFileKey(STORJ_EMAIL, bucketId, filename);
    var encrypter = new storj.EncryptStream(filekey);

    fs.createReadStream(filepath)
      .pipe(encrypter)
      .pipe(fs.createWriteStream(tmppath))
      .on('finish', function() {
        console.log('Finished encrypting');

        // create token for uploading to bucket by bucketId
        // has to be bucketId not realBucketId
        client.createToken(bucketId, 'PUSH', function(err, token) {
          if (err) {
            console.log('error', err.message);
          }
          console.log('Created token for file', token.token);

          // Store the file
          // has to be bucketId not realBucketId
          client.storeFileInBucket(bucketId, token.token, tmppath,
            function(err, file) {
              if (err) {
                return console.log('error', err.message);
              }
              console.log('Stored file in bucket');
              // Delete tmp file
              fs.unlink(tmppath, function(err) {
                if (err) {
                  return console.log(err);
                }
                console.log('Temporary encrypted file deleted');
              });

              res.status(200).send(file);
            });
        });
      });

  });
});

app.get('/files/list', function(req, res) {
  // Create object to hold all the buckets and files
  var bucketFiles = {};

  // Get buckets
  client.getBuckets(function(err, buckets) {
    if (err) {
      return console.log('error', err.message);
    }

    // Get all the buckets, and tehn return the files in the bucket
    // Assign files to bucketFiles
    async.each(buckets, function(bucket, callback) {
      console.log('bucket', bucket.id);
      client.listFilesInBucket(bucket.id, function(err, files) {
        if (err) {
          return callback(err);
        }
        console.log('files', files);
        // bucketFiles.myPictureBucket = [];
        bucketFiles[bucket.name] = files;
        callback(null);
      })
    }, function(err) {
      if (err) {
        return console.log('error');
      }
      console.log('bucketFiles', bucketFiles);
      res.status(200).send(bucketFiles);
    });
  });
});

app.get('/files/download', function(req, res) {
  console.log('Getting file to download');

  // Bucket id
  client.getBuckets(function(err, buckets) {
    if (err) {
      return console.log('error', err.message);
    }

    // Use the first bucket
    var bucketId = buckets[0].id;
    console.log('Got bucketId', bucketId);

    // Get the fileId of the file we want to download.
    client.listFilesInBucket(bucketId, function(err, files) {
      if (err) {
        return console.log('error', err.message);
      }

      // Get grumpy file
      var grumpyFile = files.find(function(file) {
        return file.filename.match(filename);
      });
      console.log('grumpy', grumpyFile);
      var fileId = grumpyFile.id;
      // Note: make sure the filename here is the same as when you generated
      // the filename when you uploaded. Because the filekey was generated
      // using the filename, they MUST match, otherwise the key will not be
      // the same and you cannot download the file
      var filename = 'grumpy.jpg'
      // Where the downloaded file will be saved
      var target = fs.createWriteStream('./public/grumpy-dwnld.jpg');

      var filekey = _getFileKey(STORJ_EMAIL, bucketId, filename);
      var decrypter = new storj.DecryptStream(filekey);

      var received = 0;
      // Download the fileId
      console.log('Creating file stream');
      client.createFileStream(bucketId, fileId, { exclude: [] },
      function(err, stream) {
        if (err) {
          return console.log('error', err.message);
        }

        // Handle stream errors
        stream.on('error', function(err) {
          console.log('warn', 'Failed to download shard, reason: %s', [err.message]);
          // Delete the partial file
          fs.unlink(filepath, function(unlinkFailed) {
            if (unlinkFailed) {
              return console.log('error', 'Failed to unlink partial file.');
            }
            if (!err.pointer) {
              return;
            }
          });
        }).pipe(through(function(chunk) {
          received += chunk.length;
          console.log('info', 'Received %s of %s bytes', [received, stream._length]);
          this.queue(chunk);
        })).pipe(decrypter)
          .pipe(target);
      });

      // Handle events emitted from file download stream
      target.on('finish', function() {
        console.log('Finished downloading file');
        res.status(200).send('successful')
      }).on('error', function(err) {
        console.log('error', err.message);
      });
    });
  });
});


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

/**
 * Deterministically generates filekey to upload/download file based on
 * mnemonic stored on keyring. This means you only need to have the mnemonic
 * in order to upload/download on different devices. Think of the mnemonic like
 * an API key i.e. keep it secret! keep it safe!
 */
function _getFileKey(user, bucketId, filename) {
  var realBucketId = storj_utils.calculateBucketId(user, bucketId);
  var realFileId = storj_utils.calculateFileId(bucketId, filename);
  var filekey = keyring.generateFileKey(realBucketId, realFileId);
  return filekey;
}


/**
 * This generates a mnemonic that is used to create deterministic keys to
 * upload and download buckets and files.
 * One mnemonic is held per keyring
 */
function _generateSeed(keyring) {
  try {
    keyring.generateDeterministicKey();
    console.log('info', 'Seed successfully generated');
  } catch (err) {
    console.error('error', err.message);
  }
};

/**
 * This retrieves the mnemonic on your keyring
 */
function _exportSeed(keyring) {
  var mnemonic = keyring.exportMnemonic();
  if (!mnemonic) {
    return false;
  } else {
    console.log('Mnemonic exported');
    return mnemonic;
  }
}

/**
 * This puts the mnemonic on your keyring. Only one mnemonic is held per
 * keyring
 */
function _importSeed(keyring) {
  if (keyring.exportMnemonic()) {
    console.log('Mnemonic already exists');
    return false;
  } else {
    keyring.importMnemonic(generateSeed());
    console.log('Mnemonic successfully imported')
    return 'Mnemonic successfully imported';
  }
}

function getMnemonic() {
  console.log('getting mnemonic')
  const seed = _exportSeed(keyring);
  if (!seed) {
    console.log('no seed')
    try {
      _generateSeed(keyring)
      _importSeed(keyring)
    } catch(err) {
      console.log('error generating')
    }
  } else {
    return seed;
  }
}
