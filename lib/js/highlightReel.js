/*!

Name: highlightReel
Dependencies: jQuery
Author: Justin Duke
Author URL: http://jmduke.com
Github URL: https://github.com/jmduke
Licensed under the MIT license

*/

;(function($) {

  $.fn.highlightReel = function (options) {

    var defaults = {
      
      count     : 5,
      title     : true,
      teaser    : true,
      linked    : true,
      stats     : true,

    }, settings = $.extend({}, defaults, options);

    this.each(function () {

      var el = $(this);

      if (options === undefined || options.username === undefined) {
        alert("You must provide a Dribbble username or ID.");
        return false;
      }

      // Generate the URL for the call to Dribbble.
      var username = settings.username;
      var url = "//api.dribbble.com/players/" + username + "/shots?callback=?";

      $.getJSON(url, function (data) {

        var limit = settings.count;
        var list = $('.shots-list');
        
        //-- turned off clearing the markup
        //var list = $('<ul class="shots"></ul>').replaceAll(el);

        // Add the number of list items we'll be needing later on.
        //-- turned off adding items
        //list.append(Array(limit).join('<li class="details" />'));
        list.children('li').each(function (index) {

          if (data.shots[index].image_400_url) {
              var imgSrc = data.shots[index].image_400_url;
          } else {
              var imgSrc = data.shots[index].image_url;
          }

          $(this).prepend('<a href="' + data.shots[index].url + '" class="shot" target="blank"><img src="' + imgSrc + '"/></a>');

        });


        if (settings.title === true) {

          list.children('li').each(function (index) {

            $(this).prepend('<span class="title">' + data.shots[index].title + "</span>");

          });

        }

      });

    });

    return this;

  };

}(jQuery));