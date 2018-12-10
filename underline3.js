animContainer3 = document.getElementById('lottie3')
 				
var params3 = {
	container: animContainer3,
	renderer: 'svg',
	loop: false,
	autoplay: false,
	autoloadSegments: true,
	path: 'underline.json'
};
 
var anim3;
anim3 = lottie.loadAnimation(params3);

anim3.addEventListener('DOMLoaded', function(e) {

  var elem3 = document.getElementById('workHack');

  elem3.addEventListener('mouseover', forwardAnimation);
  elem3.addEventListener('mouseout', reverseAnimation);

	function forwardAnimation() {
		anim3.setDirection(1);
		anim3.play();
	}
	function reverseAnimation() {
		anim3.setDirection(-1);
		anim3.play();
	}
});