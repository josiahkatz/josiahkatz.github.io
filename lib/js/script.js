// @codekit-prepend "jquery.js";
// @codekit-prepend "jribbble.js";
/* // @codekit-prepend "last.fm.js"; */

$.jribbble.setToken('125d175028de31e8fd3ec4d505b3ff4ba28d18256ce67327a9d7d73130e51bb4');


$.jribbble.users('josiahkatz').shots({per_page: 20}).then(function(shots) {
  var html = [];
  
  var list = $('.shots-list');

  shots.forEach(function(shot) {

    if (shot.images.hidpi) {
        var imgSrc = shot.images.hidpi;
    } else {
        var imgSrc = shot.images.normal;
    }
    html.push('<li class="shots-item"><a href="' + shot.html_url + '" class="shot" target="blank"><img src="' + imgSrc + '"/></a></li>');
  });
  
  $('.shots-list').html(html.join(''));
});


/*$('#albums').lfm({
   APIkey: 'c457b724999968d805b9c964aa45485e',
   User: 'josiahkatz',
   Behavior: "hover",	//or click
   limit: 20, 		// 1 album - 50 albums
   period: "6month"	//overall|7day|1month|3month|6month|12month
});*/