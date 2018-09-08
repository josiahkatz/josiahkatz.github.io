$(document).ready(function(){

  $('.section-fast .section-image').on('click', function() {
    if ($(this).hasClass('section-image-active')) {
      $(this).removeClass('section-image-active');
    } else {
      $('.section-image').removeClass('section-image-active');
      $(this).addClass('section-image-active');
    }
  });

  $('.slideshow').on({
    click: function(e){
      e.preventDefault();
      showNextImage();
    }
  });

  function showNextImage(){
      var $actEl = $('.active');
      var $nextEl = $actEl.next('.slideshow-slide');
      if($nextEl.length){
        $actEl.removeClass('active');
        $nextEl.addClass('active');
      }else{
        $actEl.removeClass('active');
        $('.slideshow-slide:first-child').addClass('active');
      }
  }
});
