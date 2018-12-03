animContainer = document.getElementById('lottie2');

var text = document.getElementById('work');
 				
var params = {
	container: animContainer,
	renderer: 'svg',
	loop: false,
	autoplay: false,
	autoloadSegments: true,
	path: 'underline.json'
};
 
var anim;
anim = lottie.loadAnimation(params);
				
text.addEventListener("mouseover", forwardAnimation);
text.addEventListener("mouseout", reverseAnimation);
			
function forwardAnimation() {
	anim.setDirection(1);
	anim.play();
}
function reverseAnimation() {
	anim.setDirection(-1);
	anim.play();
}