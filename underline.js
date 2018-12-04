animContainer2 = document.getElementById('lottie');
 				
var params2 = {
	container: animContainer2,
	renderer: 'svg',
	loop: false,
	autoplay: false,
	autoloadSegments: true,
	path: 'underline.json'
};

var anim2;
anim2 = lottie.loadAnimation(params2);

anim2.addEventListener('DOMLoaded', function(e) {

  var elem = document.getElementById('about');

  elem.addEventListener('mouseover', mouseElem);

  function mouseElem() {
	anim2.setDirection(1);
	anim2.play();
  }

});