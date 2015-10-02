// @codekit-prepend "jquery-2.1.1.js";
// @codekit-prepend "highlightReel.js";
/* // @codekit-prepend "last.fm.js"; */

$("#shots").highlightReel({
    username : "josiahkatz",
    count:12,
    stats: false,
    title: false,
    teaser: true,
    linked: true
});

/*$('#albums').lfm({
   APIkey: 'c457b724999968d805b9c964aa45485e',
   User: 'josiahkatz',
   Behavior: "hover",	//or click
   limit: 20, 		// 1 album - 50 albums
   period: "6month"	//overall|7day|1month|3month|6month|12month
});*/