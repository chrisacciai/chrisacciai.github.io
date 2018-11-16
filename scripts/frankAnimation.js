			<script src="lottie.js" type="text/javascript"></script>

			<script>
				
				animContainer = document.getElementById('lottie')
				
    			var params = {
        		container: animContainer,
        		renderer: 'svg',
        		loop: false,
				autoplay: false,
        		autoplay: false,
				autoloadSegments: false,
        		path: 'frankMouseover.json'
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
			
			</script>