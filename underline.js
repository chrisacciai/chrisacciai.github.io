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

anim.addEventListener('DOMLoaded', function(e) {

  var elem = document.getElementById('about');

  elem.addEventListener('mouseover', mouseElem);

  function mouseElem() {
    anim2.goToAndStop(1, true);
  }

});