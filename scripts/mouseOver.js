var container = document.getElementById('anim_container');
	// Set animation

var animData = {
	container: container,
    renderer: 'svg',
    autoplay: true,
    loop: true,
    path : 'frankMouseover.json'
};
var anim = bodymovin.loadAnimation(animData);// JavaScript Document