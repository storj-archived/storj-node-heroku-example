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
    });
  });

});
