$(document).ready(function() {
  // All jQuery/JavaScript code will go in here
  console.log('jquery ready');
  var grumpyPicId;

  // Get client info
  $('.credentials-btn--show').on('click', function(event) {
    event.preventDefault();
    console.log('Show Credentials button clicked');
    $('.credential-result').text('');

    $.ajax({
      method: 'GET',
      url: '/user/retrieve'
    }).done(function(credentials) {
      $('.credentials--username').html(`Username: ${credentials.email}`);
      $('.credentials--password').html(`Password: ${credentials.password}`);
    }).error(function(err) {
        handleError('Credentials', '.credential-result', 'text', err);
    });
  });

  // Authenticate client
  $('.auth-btn').on('click', function(event) {
    event.preventDefault();
    console.log('Authenticate button clicked');
    $('.auth-result').html('');

    $.ajax({
      method: 'GET',
      url: '/user/authenticate/user-pass'
    }).done(function(result) {
      if (result === 'successful') {
        $('.auth-result')
          .html('Authentication with basic auth successful!')
          .css('color', 'green');
      } else {
        $('.auth-result')
          .html('Authentication failed')
          .css('color', 'red');
      }
    }).error(function(err) {
      handleError('Authentication', '.auth-result', 'html', err);
    });
  });

  // Generate keypair
  $('.keypair-btn--generate').on('click', function(event) {
    event.preventDefault();
    console.log('Generate Key Pair button clicked');
    $('.keypair-generated').html('');

    $.ajax({
      method: 'GET',
      url: '/keypair/generate'
    }).done(function(keypair) {
      console.log('Generated key pair ', keypair);
      $('.keypair-generated')
        .html(`Key Pair generated! ${keypair}`)
        .css('color', 'green');
    }).error(function(err) {
      handleError('Key Pair Generated', '.keypair-generated', 'html', err);
    });
  });

  // Retrieve keypair
  $('.keypair-btn--retrieve').on('click', function(event) {
    event.preventDefault();
    console.log('Retrieve Key Pair button clicked');
    $('.keypair-retrieved').text('');

    $.ajax({
      method: 'GET',
      url: '/keypair/retrieve'
    }).done(function(keypairs) {
      console.log('Key pair(s) retrieved', keypairs);
      if (!keypairs.length) {
        $('.keypair-retrieved').html('No keys retrieved');
      } else {
        $('.keypair-retrieved--success')
          .html('Keys Retrieved:')
          .css('color', 'green');

        // Create an li element for each keypair and append to ul
        keypairs.forEach(function(keypair) {
          var keyItem = document.createElement('li');
          $(keyItem).text(keypair.key);
          $('.keypair-public').append(keyItem);
        });
      }
    }).error(function(err) {
      handleError('Key pair retrieved', '.keypair-retrieved', 'text', err);
    });
  });

  // Authenticate with keypair
  $('.keypair-btn--authenticate').on('click', function(event) {
    event.preventDefault();
    console.log('Authenticate (KeyPair) button clicked');
    $('.keypair-authenticated').html('')

    $.ajax({
      method: 'GET',
      url: '/keypair/authenticate'
    }).done(function(authenticated) {
      if (authenticated === 'successful') {
        $('.keypair-authenticated')
          .html('Authenticated with keypair!')
          .css('color', 'green');
      } else {
        $('.keypair.authenticated')
          .html('Keypair authentication failed')
          .css('color', 'red');
      }
    }).error(function(err) {
      handleError('Key pair authentication', '.keypair-authenticated', 'html', err);
    });
  });

  // Create bucket
  $('.bucket-btn--create').on('click', function(event) {
    event.preventDefault();
    $('.bucket-created').html('');
    var newBucketName = $('.new-bucket-name').val()
    if (!newBucketName) {
      return $('.bucket-created').html('Enter a bucket name');
    }

    $.ajax({
      method: 'POST',
      url: '/buckets/create',
      data: { name: newBucketName }
    }).done(function(bucket) {
      console.log('Bucket created', bucket);
      $('.bucket-created').text(`Bucket ${bucket.name} created!`);
      $('.new-bucket-name').val('');
    }).error(function(err) {
      handleError('Bucket creation', '.bucket-created', 'html', err);
    });
  });

  // Create bucket
  $('.bucket-btn--create').on('click', function(event) {
    event.preventDefault();
    var newBucketName = $('.new-bucket-name').val()
    if (!newBucketName) {
      return console.log('Need to enter bucket name');
    }

    $.ajax({
      method: 'POST',
      url: '/buckets/create',
      data: { name: newBucketName }
    }).done(function(bucket) {
      console.log('Bucket created', bucket);
      $('.bucket-created').text(`Bucket ${bucket.name} created!`);
      $('.new-bucket-name').val('');
    });
  });

  // List buckets
  $('.bucket-btn--list').on('click', function(event) {
    event.preventDefault();
    $('.bucket-list').html('');
    console.log('List Buckets button clicked');

    $('.buckets-list')
      .html('Retrieving buckets . . .')
      .css('color', 'orange');

    $.ajax({
      method: 'GET',
      url: '/buckets/list'
    }).done(function(buckets) {
      if (!buckets.length) {
        $('.buckets-list').html('No buckets');
      } else {
        buckets.forEach(function(bucket) {
          $('.buckets-list')
            .html('Buckets: ')
            .css('color', 'black')
          console.log(bucket);
          var bucketList = document.createElement('ul');
          $('.buckets-list').append($(bucketList));
          var bucketItem = document.createElement('li');
          $(bucketItem).html(`Name: ${bucket.name}, id: ${bucket.id}`);
          $(bucketList).append(bucketItem);
        });
      }
    }).error(function(err) {
      handleError('Bucket list', '.buckets-list', 'html', err);
    });
  });

  // Upload file
  $('.files-btn--upload').on('click', function(event) {
    event.preventDefault();

    $('.files-upload').html('');
    console.log('Upload file button clicked');
    $('.files-upload')
      .html('File upload in process . . .')
      .css('color', 'orange');

    $.ajax({
      method: 'GET',
      url: '/files/upload'
    }).done(function(file) {
      console.log('upload', file)
      $('.files-upload')
        .html(`File ${file.filename} uploaded to ${file.bucket}!`)
        .css('color', 'green');
    }).error(function(err) {
      handleError('File Upload', '.files-upload', 'html', err);
    });
  });

  // List files in bucket
  $('.files-btn--list').on('click', function(event) {
    event.preventDefault();
    $('.files-list').html('');
    console.log('List Files in Bucket button clicked');
    $('.files-list')
      .html('Retrieving files . . .')
      .css('color', 'orange');

    $.ajax({
      method: 'GET',
      url: '/files/list'
    }).done(function(bucketsWithFiles) {
      console.log(bucketsWithFiles);
      if (!bucketsWithFiles) {
        $('.files-list').html('No files in buckets');
      } else {
        for (var key in bucketsWithFiles) {
          var bucketName = document.createElement('div');
          $(bucketName)
            .html(`Bucket: ${key}`)
            .css('font-weight', '700');
          $('.files-list')
            .html($(bucketName))
            .css('color', 'black');

          var bucketFilesList = document.createElement('ul');
          $(bucketName).append(bucketFilesList);

          bucketsWithFiles[key].forEach(function(bucketFile) {
            console.log('file', bucketFile);
            var file = document.createElement('li');
            $(file)
              .html(bucketFile.filename)
              .css('font-weight', '300');
            $(bucketFilesList).append(file);
          });
        }
      }
    }).error(function(err) {
      handleError('List Files', '.files-list', 'html', err);
    });
  });

  // Download file
  $('.files-btn--download').on('click', function(event) {
    event.preventDefault();
    console.log('Download Files button clicked');
    $('.files-downloaded').html('');

    $('.files-downloaded')
      .html('Downloading in process . . .')
      .css('color', 'orange');

    $.ajax({
      method: 'GET',
      url: '/files/download'
    }).done(function(download) {
      if (download === 'successful') {
        $('.files-downloaded')
          .html('Download finished! Scroll up and see a grumpy cat!')
          .css('color', 'green');

        // Set grumpy pic
        $('.grumpy-pic').attr('src', './grumpy-dwnld.jpg')
      }
    }).error(function(err) {
      handleError('Files download', '.files-downloaded', 'html', err);
    });
  });

});

function handleError(subject, className, element, err) {
  if (err) {
    console.log(subject + ' error:', err.responseText);
    switch (err.status) {
      case 404:
        $(className)
          [element]('No endpoint! Go build it!')
          .addClass('spacer')
          .css('color', 'red');
        break;
      default:
        $(className)
          [element](subject + ' error', err.responseText)
          .addClass('spacer')
          .css('color', 'red');
    }
  }
}
