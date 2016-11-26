$(document).ready(function() {
  // All jQuery/JavaScript code will go in here
  console.log('jquery ready')

  // Generate keypair
  $('.keypair-btn--generate').on('click', function(event) {
    event.preventDefault();
    console.log('Generate Key Pair button clicked');
    $.ajax({
      method: 'GET',
      url: '/keypair/generate'
    }).done(function(keypair) {
      console.log('Generated key pair ', keypair);
      $('.keypair-generated').text('Key Pair generated!');
    })
  });

  // Retrieve keypair
  $('.keypair-btn--retrieve').on('click', function(event) {
    event.preventDefault();
    console.log('Retrieve Key Pair button clicked');
    $.ajax({
      method: 'GET',
      url: '/keypair/retrieve'
    }).done(function(keypairs) {
      console.log('Key pair(s) retrieved', keypairs);
      if (keypairs.length <= 0) {
        $('.keypair-retrieved').html('No keys retrieved')
      } else {
        keypairs.forEach(function(keypair) {
          const keyItem = document.createElement('li');
          $(keyItem).text(keypair.key);
          $('.keypair-public').append(keyItem);
        });
      }
    });
  });

  // Get client info
  $('.credentials-btn--show').on('click', function(event) {
    event.preventDefault();
    console.log('Show Credentials button clicked');
    $.ajax({
      method: 'GET',
      url: '/user/retrieve'
    }).done(function(credentials) {
      $('.credentials--username').append(credentials.email);
      $('.credentials--password').append(credentials.password);
    })
  })

  // Authenticate client
  $('.auth-btn').on('click', function(event) {
    event.preventDefault();
    console.log('Authenticate button clicked');
    $.ajax({
      method: 'GET',
      url: '/user/authenticate/user-pass'
    }).done(function(result) {
      if (result === 'successful') {
        $('.auth-result').html('Authentication successful!')
      }
    })
  })

  // List buckets
  $('.bucket-btn--retrieve').on('click', function(event) {
    event.preventDefault();
    console.log('List Buckets button clicked');
    $.ajax({
      method: 'GET',
      url: '/buckets/retrieve'
    }).done(function(buckets) {
      if (buckets.length <= 0) {
        $('.buckets-retrieved').html('No buckets');
      } else {
        buckets.forEach(function(bucket) {
          console.log(bucket)
          const bucketItem = document.createElement('li');
          $(bucketItem).text(`Name: ${bucket.name}, id: ${bucket.id}`);
          $('.buckets-retrieved--list').append(bucketItem);
        })
      }
    })
  })

  // Create bucket
  $('.bucket-btn--create').on('click', function(event) {
    event.preventDefault();
    const newBucketName = $('.new-bucket-name').val()
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
    })
  })

  // List files in bucket
  $('.files-btn--list').on('click', function(event) {
    event.preventDefault();
    $.ajax({
      method: 'GET',
      url: '/files/retrieve'
    }).done(function(bucketsWithFiles) {
      console.log(bucketsWithFiles)
      if (!bucketsWithFiles) {
        $('.files-list').html('No files in buckets')
      } else {
        for (let key in bucketsWithFiles) {
          const bucketName = document.createElement('div');
          $(bucketName).text(key).css('font-weight', '700')
          $('.files-list').append($(bucketName));

          const bucketFilesList = document.createElement('ul');
          $(bucketName).append(bucketFilesList);

          bucketsWithFiles[key].forEach(function(bucketFile) {
            console.log('file', bucketFile)
            const file = document.createElement('li');
            $(file).text(bucketFile.filename).css('font-weight', '300');
            $(bucketFilesList).append(file);
          })
        }
      }
    })
  })
});
