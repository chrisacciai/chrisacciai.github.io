animContainer = document.getElementById('lottie2')
 				
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
				
animContainer.addEventListener("mouseover", forwardAnimation);
animContainer.addEventListener("mouseout", reverseAnimation);
			
function forwardAnimation() {
	anim.setDirection(1);
	anim.play();
}
function reverseAnimation() {
	anim.setDirection(-1);
	anim.play();
}