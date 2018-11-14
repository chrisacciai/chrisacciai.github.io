var animation = bodymovin.loadAnimation({
  container: document.getElementById('bm'),
  renderer: 'svg',
  loop: true,
  autoplay: true,
  path: 'data.json'
})  <script src="js/data.js"></script>
  <script>
   var container = document.getElementById('anim_container');
    // Set up our animation 
    var animData = {
        container: container,
        renderer: 'svg',
        autoplay: true,
        loop: true,
        animationData : data
    };
    var anim = bodymovin.loadAnimation(animData);
  </script>var container = document.getElementById('anim_container');
	  container: element, // the dom element that will contain the animation
  renderer: 'svg',
  loop: true,
  autoplay: true,
  path: 'data.json' // the path to the animation json// Set animation

var animData = {
	container: container,
    renderer: 'svg',
    autoplay: true,
    loop: true,
    path : 'frankMouseover.json'
};
var anim = bodymovin.loadAnimation(animData);// JavaScript Document