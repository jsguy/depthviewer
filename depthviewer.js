/*
	TODO

	This is a giant mess, but works for the given example

	. Make it work with landscape photos, eg: greek helmet
	. Make a function that takes image source and a container element
	. Make the size calculations based on the container, not the window
	. Clean the code up, there are variables and hard-coded stuff eveywhere!
	. Create example with two images
	. Make the animation configurable (radius, angleIncrement)

*/

'use strict';

var settings = {
	smoothRadius: 10,
	quadSize: 4,
	pointSize: 3,
	animate: true
};

function showLoading( show ) {
	if( show ) loading.style.opacity = 1;
	else loading.style.opacity = 0;
}

function showMessage( msg ) {
	message.querySelector( 'p' ).innerHTML = msg;
	message.style.opacity = 1;
}

var container = document.getElementById( 'container' );
var loading = document.getElementById( 'loading' );
var message = document.getElementById( 'message' );
message.querySelector( 'a' ).addEventListener( 'click', function( e ) {
	message.style.opacity = 0;
} );

var d = new DepthReader();

var imgSrc = new Image();

window.addEventListener( 'load', init );

function init() {

	//	1: 'solid', 2: 'point', 3: 'wireframe'
	var renderMode = 1;
	var material, meshSolid, meshPoint;
	var renderer, scene, camera, fov = 70, nFov = fov, distance = 500, nDistance = distance;
	var displacement = 0, nDisplacement = displacement;

	var isUserInteracting = false, isUserPinching = false;
	var onPointerDownPointerX, onPointerDownPointerY, onPointerDownLon, onPointerDownLat;
	var lon = 90, lat = 0, nLon = lon, nLat = lat;
	var oDist, oFov, adjustment = 0;

	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera( fov, window.innerWidth / window.innerHeight, .1, 1000 );
	camera.target = new THREE.Vector3( 0, 0, 0 );
	camera.position.y = 500;
	scene.add( camera );

	renderer = new THREE.WebGLRenderer( { antialias: true, alpha: false } );
	renderer.setClearColor( 0, 0 );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.sortObjects = true;

	container.appendChild( renderer.domElement );

	window.addEventListener( 'resize', onResize );

	container.addEventListener( 'mousedown', onContainerMouseDown, false );
	container.addEventListener( 'mousemove', onContainerMouseMove, false );
	container.addEventListener( 'mouseup', onContainerMouseUp, false );
	
	container.addEventListener( 'touchstart', onTouchStart, false );
	container.addEventListener( 'touchmove', onTouchMove, false );
	container.addEventListener( 'touchend', onTouchEnd, false );
	container.addEventListener( 'touchcancel', onTouchEnd, false );
	
	container.addEventListener( 'mousewheel', onContainerMouseWheel, false );
	container.addEventListener( 'DOMMouseScroll', onContainerMouseWheel, false); 

	function onResize() {
		var w = container.clientWidth,
			h = container.clientHeight;

		renderer.setSize( w, h );
		if(theImage) {
			enableClipping();
		}
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
	}

	function onContainerMouseDown( event ) {
		
		event.preventDefault();

		isUserInteracting = true;
		var el = document.querySelectorAll( '.hide' );
		for( var j = 0; j < el.length; j++ ) {
			el[ j ].style.opacity = 0;
			el[ j ].style.pointerEvents = 'none';
		}
		
		onPointerDownPointerX = event.clientX;
		onPointerDownPointerY = event.clientY;

		onPointerDownLon = lon;
		onPointerDownLat = lat;
		
	}
	
	function onContainerMouseMove( event ) {

		event.preventDefault();
		
		var lookSpeed = .15;
		var f = fov / 500;
		if( navigator.pointer && navigator.pointer.isLocked ) {
			nLon = event.webkitMovementX * f;
			nLat = event.webkitMovementY * f;
		} else if ( document.mozPointerLockElement == container ){
			if( Math.abs( event.mozMovementX ) < 100 || Math.abs( event.mozMovementY ) < 100 ) { 
				nLon -= event.mozMovementX * f;
				nLat -= event.mozMovementY * f;
			}
		} else {
			if ( isUserInteracting ) {
				var dx = ( onPointerDownPointerX - event.clientX ) * f;
				var dy = ( onPointerDownPointerY - event.clientY ) * f;
				nLon = dx + onPointerDownLon;
				nLat = dy + onPointerDownLat;
			}
		}
	}

	function onContainerMouseUp( event ) {

		event.preventDefault();
		isUserInteracting = false;
		var el = document.querySelectorAll( '.hide' );
		for( var j = 0; j < el.length; j++ ) {
			el[ j ].style.opacity = 1;
			el[ j ].style.pointerEvents = 'auto';
		}

	}
	
	function onContainerMouseWheel( event ) {
		event = event ? event : window.event;
		nDistance = nDistance - ( event.detail ? event.detail * -5 : event.wheelDelta / 8 );
	}

	function onTouchStart( event ) {

		isUserInteracting = true;
		var el = document.querySelectorAll( '.hide' );
		for( var j = 0; j < el.length; j++ ) {
			el[ j ].style.opacity = 0;
			el[ j ].style.pointerEvents = 'none';
		}

		if( event.touches.length == 2 ) {

			var t = event.touches;
			oDist = Math.sqrt(
					Math.pow( t[ 0 ].clientX - t[ 1 ].clientX, 2 ) +
					Math.pow( t[ 0 ].clientY - t[ 1 ].clientY, 2 ) );
			oFov = nFov;
			
			isUserPinching = true;

		} else {

		  var t = event.touches[ 0 ];
		
		  onPointerDownPointerX = t.clientX;
		  onPointerDownPointerY = t.clientY;

		  onPointerDownLon = lon;
		  onPointerDownLat = lat;

		}

	  event.preventDefault();
	    
	}

	function onTouchMove( event ) {

		if( event.touches.length == 2 ) {

			var t = event.touches;
			var dist = Math.sqrt(
			Math.pow( t[ 0 ].clientX - t[ 1 ].clientX, 2 ) +
			Math.pow( t[ 0 ].clientY - t[ 1 ].clientY, 2 ) );

			nFov = oFov + .1 * ( oDist - dist );

		} else {

		  var t = event.touches[ 0 ];
		  nLon = .1 * ( t.clientX - onPointerDownPointerX ) + onPointerDownLon;
		  nLat = .1 * ( t.clientY - onPointerDownPointerY ) + onPointerDownLat;

		 }

	  event.preventDefault();

	}

	function onTouchEnd( event ) {

		event.preventDefault();
		isUserInteracting = false;
		var el = document.querySelectorAll( '.hide' );
		for( var j = 0; j < el.length; j++ ) {
			el[ j ].style.opacity = 1;
			el[ j ].style.pointerEvents = 'auto';
		}

	}

	var theImage;
	//	Clip at pct around the image
	function enableClipping(){
		var pct = 0.12,
			pRatio = window.innerHeight / theImage.height,
			pIWidth = theImage.width * pRatio,
			pIHeight = theImage.height * pRatio,
			pX = window.innerWidth / 2 - (pIWidth/2) + (pIWidth * pct),
			pY = pIHeight * (pct),
			pWidth = pIWidth - 2 * (pIWidth * pct),
			pHeight = pIHeight - 2 * (pIHeight * pct);

		renderer.setScissor( pX, pY, pWidth, pHeight );
		renderer.enableScissorTest( true );
	};

	//	For animation - big radius = big circle, angleIncrement is how much to add per animationFrame
	var radius = 0.75, angle = 0, angleIncrement = 1.5;

	function render() {

		//	This will continually render
		requestAnimationFrame( render );

		nDistance = (nDistance < camera.near)? camera.near: nDistance;
		
		lon += ( nLon - lon ) * .1;
		lat += ( nLat - lat ) * .1;
		fov += ( nFov - fov ) * .1; 
		distance += ( nDistance - distance ) * .1; 
		displacement += ( nDisplacement - displacement ) * .1; 

		camera.fov = fov;

		camera.updateProjectionMatrix();

		if( meshPoint ) {
			meshPoint.scale.z = adjustment * displacement;
			meshPoint.visible = ( renderMode == 2 );
		}
		if( meshSolid ) {
			meshSolid.scale.z = adjustment * displacement;
			meshSolid.visible = ( renderMode == 1 || renderMode == 3 );
			meshSolid.material.wireframe = ( renderMode == 3 );
		}

		lat = Math.max( - 85, Math.min( 85, lat ) );
		var phi = ( 90 - lat ) * Math.PI / 180;
		var theta = lon * Math.PI / 180;

		camera.position.x = distance * Math.sin( phi ) * Math.cos( theta );
		camera.position.y = distance * Math.cos( phi );
		camera.position.z = distance * Math.sin( phi ) * Math.sin( theta );

		camera.lookAt( camera.target );

		renderer.render( scene, camera );

		if(settings.animate && ! isUserInteracting) {
		    /// calc x and y position with radius at given angle
		    var x = radius * Math.cos(angle * Math.PI / 180);
		    var y = radius * Math.sin(angle * Math.PI / 180);

		    angle = (angle >359)? 0: angle + angleIncrement;

			nLon = 90 + x;
			nLat = 0 +y;
		}

	}

	function setImg() {

		if( meshSolid ) { scene.remove( meshSolid ); }
		if( meshPoint ) { scene.remove( meshPoint ); }

		displacement = nDisplacement = 0;

		var img = new Image();
		img.onload = function() {

			imgSrc.onload = function() {

				var s = 6;
				var w = Math.round( img.width / s ),
					h = Math.round( img.height / s );

				var canvas = document.createElement( 'canvas' ),
					ctx = canvas.getContext( '2d' );

				canvas.width = img.width;
				canvas.height = img.height;
				ctx.drawImage( img, 0, 0 );

				stackBlurCanvasRGB( canvas, 0, 0, canvas.width, canvas.height, parseInt( settings.smoothRadius, 10 ) );

				var imageData = ctx.getImageData( 0, 0, canvas.width, canvas.height );
				var p = 0;

				var colorCanvas = document.createElement( 'canvas' ),
					colorCtx = colorCanvas.getContext( '2d' );

				colorCanvas.width = imgSrc.width;
				colorCanvas.height = imgSrc.height;
				colorCtx.drawImage( imgSrc, 0, 0 );
				var colorImageData = colorCtx.getImageData( 0, 0, colorCanvas.width, colorCanvas.height );
				var colorP = 0;

				var far = parseFloat( d.depth.far ),
					near = parseFloat( d.depth.near );

				var geometry = new THREE.BufferGeometry();
				var size = w * h;

				// geometry.addAttribute( 'position', Float32Array, size, 3 );
				// geometry.addAttribute( 'customColor', Float32Array, size, 3 );
				geometry.addAttribute( 'position', new Float32Array(3) );
				geometry.addAttribute( 'customColor', new Float32Array(3) );
			
				var positions = geometry.attributes.position.array;
				var customColors = geometry.attributes.customColor.array;

				adjustment = 10 * 960 / img.width;
				var ar = img.height / img.width;
				var scale = new THREE.Vector3( 1, 1, 1 );
				var v = new THREE.Vector3();
				var ptr = 0;

				var minZ = 100000000000, maxZ = -100000000000;
				for( var y = 0; y < h; y++ ) {
					for( var x = 0; x < w; x++ ) {
						v.x = ( x - .5 * w ) / w;
						v.y = ( y - .5 * h ) / h;
						p = Math.round( ( ( -v.y + .5 ) ) * ( img.height - 1 ) ) * img.width * 4 + Math.round( ( ( v.x + .5 ) ) * ( img.width - 1 ) ) * 4;
						var dn = imageData.data[ p ] / 255;
						var rd = ( far * near ) / ( far - dn * ( far - near ) ); // RangeInverse
						//var rd = ( 1 - dn ) * ( far - near ) + near; // RangeLinear
						v.z = -rd ;
						v.x *= rd * 1;
						v.y *= rd * ar;
						v.multiply( scale );

						positions[ ptr + 0 ] = v.x;
						positions[ ptr + 1 ] = v.y;
						positions[ ptr + 2 ] = v.z;

						customColors[ ptr + 0 ] = colorImageData.data[ p + 0 ] / 255;
						customColors[ ptr + 1 ] = colorImageData.data[ p + 1 ] / 255;
						customColors[ ptr + 2 ] = colorImageData.data[ p + 2 ] / 255;
						
						ptr += 3;

						if( v.z < minZ ) minZ = v.z;
						if( v.z > maxZ ) maxZ = v.z;
					}
				}

				var offset = ( maxZ - minZ ) / 2;
				for( var j = 0; j < positions.length; j+=3 ) {
					positions[ j + 2 ] += offset;
				}

				var step = settings.quadSize;
				var planeGeometry = new THREE.PlaneGeometry( 1, 1, Math.round( w / step ), Math.round( h / step ) );
				ptr = 0;
				for( var j = 0; j < planeGeometry.vertices.length; j++ ) {
					v = planeGeometry.vertices[ j ];
					p = Math.round( ( ( -v.y + .5 ) ) * ( img.height - 1 ) ) * img.width * 4 + Math.round( ( ( v.x + .5 ) ) * ( img.width - 1 ) ) * 4;
					var dn = imageData.data[ p ] / 255;
					//console.log( v, p, dn );
					var rd = ( far * near ) / ( far - dn * ( far - near ) ); // RangeInverse
					//var rd = ( 1 - dn ) * ( far - near ) + near; // RangeLinear
					v.z = -rd ;
					v.x *= rd * 1;
					v.y *= rd * ar;
					v.multiply( scale );
					v.z += offset;
				}

				planeGeometry.computeFaceNormals();
				planeGeometry.computeVertexNormals();

				var tex = new THREE.Texture( imgSrc );
				tex.needsUpdate = true;
				meshSolid = new THREE.Mesh( planeGeometry, new THREE.MeshBasicMaterial( { map: tex, wireframe: false, side: THREE.DoubleSide }) );
				meshSolid.scale.set( adjustment, adjustment, adjustment );
				scene.add( meshSolid );
				if( renderMode == 2 ) meshSolid.visible = false; 

				meshPoint = new THREE.PointCloud( geometry, material );
				meshPoint.scale.set( adjustment, adjustment, adjustment );
				meshPoint.frustumCulled = false;
				scene.add( meshPoint );
				if( renderMode == 1 ) meshPoint.visible = false; 
				
				nDistance = parseFloat( d.focus.focalDistance ) + offset * adjustment;
				
				nFov = 1 * Math.atan2( .5 * adjustment * near, d.focus.focalDistance ) * 180 / Math.PI;

				material.uniforms.size.value = settings.pointSize * nDistance;
				nDisplacement = 1;

				camera.near = .001;
				camera.far = ( far + ( maxZ - minZ ) ) * adjustment;
				camera.updateProjectionMatrix();


				// //	Try scissors?
				// var pct = 0.12,
				// 	pRatio = window.innerHeight / img.height,
				// 	pIWidth = img.width * pRatio,
				// 	pIHeight = img.height * pRatio,
				// 	pX = window.innerWidth / 2 - (pIWidth/2) + (pIWidth * pct),
				// 	pY = pIHeight * (pct),
				// 	pWidth = pIWidth - 2 * (pIWidth * pct),
				// 	pHeight = pIHeight - 2 * (pIHeight * pct);

				// renderer.setScissor( pX, pY, pWidth, pHeight );
				// renderer.enableScissorTest( true );
				theImage = img;
				enableClipping();

				nLat = 0;
				nLon = 90;

				showLoading( false );

			}

			imgSrc.src = 'data:' + d.image.mime + ';base64,' + d.image.data;

		}

		img.src = 'data:' + d.depth.mime + ';base64,' + d.depth.data;

	}

	function onError( msg ) {
		showLoading( false );
		showMessage( msg );
	}


	var sL = new ShaderLoader()
	sL.add( 'particle-vs', 'shaders/particle-vs.glsl' );
	sL.add( 'particle-fs', 'shaders/particle-fs.glsl' );
	sL.onLoaded( function() {

		material = new THREE.ShaderMaterial( {
			attributes: {
				customColor: { type: 'c', value: null }
			},
			uniforms: {
				size: { type: 'f', value: 1 },
				displacement: { type: 'f', value: 0 }
			},
			vertexShader: this.get( 'particle-vs' ),
			fragmentShader: this.get( 'particle-fs' )
		} );

		showLoading( true );
		//var src = 'assets/window.jpg';
		var src = 'assets/alleyway.jpg';
		//var src= 'assets/greek-helmet.jpg'
		//var src = 'assets/jules.jpg';
		d.loadFile( src, setImg, onError );

	} );
	sL.load();

	onResize();
	render();

}

