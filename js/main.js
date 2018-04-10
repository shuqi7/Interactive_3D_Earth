// for pre-loading
$(window).on("load", function() {
  // Animate loader off screen
  $(".se-pre-con").fadeOut(1500);;
});

  var usaStates = ['Washington', 'Oregon', 'California', 'Texas', 'Oklahoma', 'Texas', 'Minnesota', 'Indiana', 'Carolina', 'Delaware', 'Jersey', 'Michigan', 'Illinois', 'Missouri', 'Connecticut', 'Maryland', 'York', 'Ohio', 'Kentucky'];

  var canvas, scene, renderer, data;

	// Cache DOM selectors
	var container = document.getElementsByClassName('js-globe')[0];

	// Object for country HTML elements and variables
	var elements = {};


	// Three group objects
	var groups = {
		main: null, // A group containing everything
		globe: null, // A group containing the globe sphere (and globe dots)
		globeDots: null, // A group containing the globe dots
		lines: null, // A group containing the lines between each country
	};

	// Map properties for creation and rendering
	var props = {
		mapSize: {
			// Size of the map from the intial source image (on which the dots are positioned on)
			width: 2048 / 2,
			height: 1024 / 2
		},
		globeRadius: 200, // Radius of the globe (used for many calculations)
		colours: {
			// Cache the colours
			globeDots: 'rgb(61, 137, 164)', // No need to use the Three constructor as this value is used for the HTML canvas drawing 'fillStyle' property
			lines: new THREE.Color('#eeff5d'),
			lineDots: new THREE.Color('#18FFFF')
		},
		alphas: {
			// Transparent values of materials
			globe: 0.4,
			lines: 0.5
		}
	};

	// Angles used for animating the camera
	var camera = {
		light: null,
		object: null, // Three object of the camera
		controls: null, // Three object of the orbital controls
	};
	// Booleans and values for animations
	var animations = {
		finishedIntro: false, // Boolean of when the intro animations have finished
		dots: {
			current: 0, // Animation frames of the globe dots introduction animation
			total: 170, // Total frames (duration) of the globe dots introduction animation,
			points: [] // Array to clone the globe dots coordinates to
		},
	};

	// Boolean to enable or disable rendering when window is in or out of focus
	var isHidden = false;

	// drawCount sets the range of curve for animation
	var drawCount = 0;

	function showFallback() {
		/*
			This function will display an alert if WebGL is not supported.
		*/
		alert('WebGL not supported. Please use a browser that supports WebGL.');
	}

	function setupScene() {
		canvas = container.getElementsByClassName('js-canvas')[0];
		scene = new THREE.Scene();
		renderer = new THREE.WebGLRenderer({
			canvas: canvas,
			antialias: true,
			alpha: true,
			shadowMapEnabled: true
		});

		renderer.setSize(canvas.clientWidth, canvas.clientHeight);
		renderer.setPixelRatio(1);
		renderer.setClearColor(0x000000, 0);

		// Main group that contains everything
		groups.main = new THREE.Group();
		groups.main.name = 'Main';

		// Group that contains lines for each country
		groups.lines = new THREE.Group();
		groups.lines.name = 'Lines';
		groups.main.add(groups.lines);

		// Group that contains dynamically created dots
		groups.lineDots = new THREE.Group();
		groups.lineDots.name = 'Dots';
		groups.main.add(groups.lineDots);

		//add Ambient light
		scene.add(new THREE.AmbientLight(0x333333));

		//add directional light
		camera.light = new THREE.DirectionalLight(0xffffff, 1);
		camera.light.position.set(4.1, 30, 18.8);
		scene.add(camera.light);
		// gui.add(camera.light.position, 'y', 0, 20);
		// gui.add(camera.light.position, 'x', 0, 20);
		// gui.add(camera.light.position, 'z', 0, 20);

		// Add the main group to the scene
		scene.add(groups.main);

		// Render camera and add orbital controls
		addCamera();
		addControls();

		// Render objects
		addGlobe();

		//	if (Object.keys(data.countries).length > 0) {
		//addLines();
		createListElements();

		// Start the requestAnimationFrame loop
		render();
		animate();
		var canvasResizeBehaviour = function() {
			var topGlow = document.getElementById('top-glow');
      var globeContainer = document.getElementsByClassName('js-globe')[0];
      // console.log($(".js-globe").width());
			// set the width and height of globe div
			// container.height = window.innerHeight;
			// container.style.width = container.width +  'px';
			// 	container.style.height = container.width *0.85 + 'px';
			// topGlow.style.width = container.width + 'px';
			// topGlow.style.height = container.width * 0.85 + 'px';

      var currentWidth = $("#globeContainer").width();
      var currentHeight = $("#globeContainer").height();

			var width = window.innerWidth;
			if (width <= 1150) {
				// console.log(width);
				container.width = currentWidth;
        container.height = currentHeight *0.8;
			} else {
				container.width = currentWidth;
        container.height = currentHeight;
			}

				container.style.width = container.width +  'px';
			 	container.style.height = container.width *0.85 + 'px';
				topGlow.style.width = container.width + 'px';
				topGlow.style.height = container.width *0.85 + 'px';

		 	// set the width and height of top glow div
		 	//topGlow.style.width = container.style.width;

			camera.object.aspect = container.offsetWidth / container.offsetHeight;
			camera.object.updateProjectionMatrix();
			renderer.setSize(container.offsetWidth, container.offsetHeight);
		};

		window.addEventListener('resize', canvasResizeBehaviour);
		window.addEventListener('orientationchange', function() {
			setTimeout(canvasResizeBehaviour, 0);
		});

		canvasResizeBehaviour();
		checkScreenSize();
	}





	/* CAMERA AND CONTROLS */
	function addCamera() {
		camera.object = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 1, 10000);
		camera.object.position.z = -335;
		camera.object.position.x = -108;
		camera.object.position.y = 272;
	}

	function addControls() {
		camera.controls = new OrbitControls(camera.object, canvas);
		camera.controls.enableKeys = false;
		camera.controls.enablePan = false;
		camera.controls.enableZoom = false;
		camera.controls.enableDamping = false;
		camera.controls.enableRotate = true;
		camera.controls.minDistance = 500;
		camera.controls.maxDistance = 5000;
		camera.controls.autoRotate = true; //this is what allows rotation around the globe without DOM element positiong being lost
		camera.controls.autoRotateSpeed = 1;
	}

	/* RENDERING */
	function render() {
		renderer.render(scene, camera.object);
	}
	if ('hidden' in document) {
		document.addEventListener('visibilitychange', onFocusChange);
	} else if ('mozHidden' in document) {
		document.addEventListener('mozvisibilitychange', onFocusChange);
	} else if ('webkitHidden' in document) {
		document.addEventListener('webkitvisibilitychange', onFocusChange);
	} else if ('msHidden' in document) {
		document.addEventListener('msvisibilitychange', onFocusChange);
	} else if ('onfocusin' in document) {
		document.onfocusin = document.onfocusout = onFocusChange;
	} else {
		window.onpageshow = window.onpagehide = window.onfocus = window.onblur = onFocusChange;
	}

	function onFocusChange(event) {
		var visible = 'visible';
		var hidden = 'hidden';
		var eventMap = {
			focus: visible,
			focusin: visible,
			pageshow: visible,
			blur: hidden,
			focusout: hidden,
			pagehide: hidden
		};
		event = event || window.event;
		if (event.type in eventMap) {
			isHidden = true;
		} else {
			isHidden = false;
		}
	}


	function animate() {
		camera.light.position.copy(camera.object.getWorldPosition());
		if (isHidden === false) {
			requestAnimationFrame(animate);
		}
		if (groups.globeDots) {
			introAnimate();
		}
		if (animations.finishedIntro === true) {
			animateDots();
		}
		positionElements();
		camera.controls.update();
		checkPinVisibility();
		render();
	}

	/* GLOBE */
	function addGlobe() {
		var textureLoader = new THREE.TextureLoader();
		textureLoader.setCrossOrigin(true);
		var radius = props.globeRadius - (props.globeRadius * 0.02);
		var segments = 64;
		var rings = 64;

		// Make gradient
		var canvasSize = 128;
		var textureCanvas = document.createElement('canvas');
		textureCanvas.width = canvasSize;
		textureCanvas.height = canvasSize;
		var canvasContext = textureCanvas.getContext('2d');
		canvasContext.rect(0, 0, canvasSize, canvasSize);
		var canvasGradient = canvasContext.createLinearGradient(0, 0, 0, canvasSize);
		canvasGradient.addColorStop(0, '#5B0BA0');
		canvasGradient.addColorStop(0.5, '#260F76');
		canvasGradient.addColorStop(1, '#130D56');
		canvasContext.fillStyle = canvasGradient;
		canvasContext.fill();

		// Make texture
		var texture = new THREE.Texture(textureCanvas);
		texture.needsUpdate = true;
		var globe = new THREE.Group();
		var loader = new THREE.TextureLoader();
		loader.load('img/no_clouds.jpg', function(texture) {

			// Create the sphere
			var sphere = new THREE.SphereGeometry(radius, segments, rings);
      //sphere.rotateY(THREE.Math.degToRad(-180));
			var bump = new THREE.TextureLoader().load('img/bump.jpg');
			var spec = new THREE.TextureLoader().load('img/specular.png');



			// Map the texture to the material.
			var material = new THREE.MeshPhongMaterial({
				map: texture,
				bumpMap: bump,
				bumpScale: 1.5,
				specularMap: spec,
				specular: new THREE.Color('grey'),
				shininess: 5,
				overdraw: 0.5
			});

			// Create a new mesh with sphere geometry.
			mesh = new THREE.Mesh(sphere, material);
			globe.add(mesh);
		});

		var clouds = new THREE.TextureLoader().load('img/clouds.png');
		cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(radius + 1.5, segments, rings), new THREE.MeshPhongMaterial({
			map: clouds,
			transparent: true
		}));

		globe.add(cloudMesh);

		// globe.rotation.y = 5.99;
		// globe.rotation.x = 15.9;
		// globe.rotation.z = 9.3;
		groups.globe = new THREE.Group();
		groups.globe.name = 'Globe';
		groups.globe.add(globe);
		groups.main.add(groups.globe);
		addGlobeDots();
	}

	function addGlobeDots() {
		var geometry = new THREE.Geometry();
		// Make circle
		var canvasSize = 16;
		var halfSize = canvasSize / 2;
		var textureCanvas = document.createElement('canvas');
		textureCanvas.width = canvasSize;
		textureCanvas.height = canvasSize;
		var canvasContext = textureCanvas.getContext('2d');
		canvasContext.beginPath();
		canvasContext.arc(halfSize, halfSize, halfSize, 0, 2 * Math.PI);
		canvasContext.fillStyle = props.colours.globeDots;
		canvasContext.fill();

		// Make texture
		var texture = new THREE.Texture(textureCanvas);
		texture.needsUpdate = true;
		var material = new THREE.PointsMaterial({
			map: texture,
			size: props.globeRadius / 120
		});

		var addDot = function(targetX, targetY) {

			// Add a point with zero coordinates
			var point = new THREE.Vector3(0, 0, 0);
			geometry.vertices.push(point);

			// Add the coordinates to a new array for the intro animation
      var result = xyz_from_lat_lng(targetX,targetY,props.globeRadius);

			animations.dots.points.push(new THREE.Vector3(result.x, result.y, result.z));
		};


		for (var x = 0; x < allCompanies.length; x++) { //for dots with labels
			addDot(allCompanies[x].lat, allCompanies[x].lng);
		}

		// Add the points to the scene
		groups.globeDots = new THREE.Points(geometry, material);
		groups.globe.add(groups.globeDots);
		console.log(groups.globeDots.geometry.vertices);
	}


	function checkPinVisibility() {
		var earth = groups.globe.children[0].children[1];
		if (earth !== undefined) {
			var cameraToEarth = earth.position.clone().sub(camera.object.position);
			var L = Math.sqrt(Math.pow(cameraToEarth.length(), 2) - Math.pow(earth.geometry.parameters.radius, 2));
			for (var i = 0; i < $(".globe-list li").length; i++) {
				var cameraToPin = groups.globeDots.geometry.vertices[i].clone().sub(camera.object.position);
				var index = i + 1;
				if (cameraToPin.length() > L + 40) {
					$(".globe-list li:nth-child(" + index + ")").css("display", "none");
				} else {
					$(".globe-list li:nth-child(" + index + ")").css("display", "");
				}
			}
		}
	}




	/* COUNTRY LINES AND DOTS */
  var PI180 = Math.PI / 180.0;
	function animatedCurve(e, i) {

		// Create the geometry
		var geometry = new THREE.BufferGeometry();
		// aCountry represent the country that current country is trying to connect
		var aCountry = allCompanies[i];
		// line mesh represeting aCountry
		var curveObject = null;

		var group = new THREE.Group();


    var pointsPosition = [];
    var spline_control_points = 8;
    var max_height = 0.3 * 50 + 0.05;  // change 0.3 to adjust height of the curve

    for (var i = 0; i < spline_control_points + 1; i++) {
        var arc_angle = i * 180.0 / spline_control_points;
        var arc_radius = props.globeRadius+ Math.sin(arc_angle * PI180) * max_height;

        var latlng = lat_lng_inter_point(e.lat, e.lng, aCountry.lat, aCountry.lng, i / spline_control_points);
        var pos = xyz_from_lat_lng(latlng.lat, latlng.lng, arc_radius);

        pointsPosition.push(new THREE.Vector3(pos.x, pos.y, pos.z));
    }

    var curve= new THREE.CatmullRomCurve3(pointsPosition);

		 // Get verticies from curve
		 geometry.vertices = curve.getPoints(200);

		// Get verticies from curve
		const points = new Float32Array(600);
		geometry.addAttribute('position', new THREE.BufferAttribute(points, 3));
		for (let k = 0, j = 0; k < geometry.vertices.length; k++) {
			var vertex = geometry.vertices[k];
			points[j++] = vertex.x;
			points[j++] = vertex.y;
			points[j++] = vertex.z;
		}
		geometry.setDrawRange(0, 2);

		// Create the mesh line material using the plugin
		var material = new THREE.LineBasicMaterial({
			color: props.colours.lines,
			opacity: props.alphas.lines,
      linewidth: 20,
		});

		// Create the final object to add to the scene
		curveObject = new THREE.Line(geometry, material);

		curveObject._path = geometry.vertices;

		groups.lines.add(curveObject);
	}


	function updateCurve() {
    $(".globe-list").off("click");
		// determine the speed of the animation
		drawCount += 2;
		// animate every curve by changing drawCount
		for (var i = 0; i < groups.lines.children.length; i++) {
			groups.lines.children[i].geometry.setDrawRange(0, drawCount);
		}
		if (drawCount <= 200) {
			requestAnimationFrame(updateCurve);
		} else {
			// set drawCount to 0 in order for the animation in the next click
			drawCount = 0;
      $(".globe-list").on("click", clickFn);
      $(".globe-list").on("click", "li", clickChangeColor);
			return;
		}
	}


  /* COORDINATE CALCULATIONS */
  // Returns an object of 3D spherical coordinates
   function xyz_from_lat_lng(lat, lng, radius) {
        var phi = (90 - lat) * PI180;
        var theta = (360 - lng) * PI180;

        return {
            x: radius * Math.sin(phi) * Math.cos(theta),
            y: radius * Math.cos(phi),
            z: radius * Math.sin(phi) * Math.sin(theta)
        };
    }

    // interpolation for catmull curve
    function lat_lng_inter_point(lat1, lng1, lat2, lng2, offset) {

        lat1 = lat1 * PI180;
        lng1 = lng1 * PI180;
        lat2 = lat2 * PI180;
        lng2 = lng2 * PI180;

        var d = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin((lat1 - lat2) / 2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lng1 - lng2) / 2), 2)));
        var A = Math.sin((1 - offset) * d) / Math.sin(d);
        var B = Math.sin(offset * d) / Math.sin(d);
        var x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
        var y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
        var z = A * Math.sin(lat1) + B * Math.sin(lat2);
        var lat = Math.atan2(z, Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))) * 180 / Math.PI;
        var lng = Math.atan2(y, x) * 180 / Math.PI;

        return {
          lat: lat,
          lng: lng
        }
    }



	/* ELEMENTS */
	var list;

	function createListElements() {
		list = document.getElementsByClassName('js-list')[0];
		var pushObject = function(coordinates, target) {

			// Create the element
			var element = document.createElement('li');
			var innerContent;
			//var targetCountry = data.countries[target];
			var targetCountry = allCompanies[target]; // REPLACEMENT
			console.log(targetCountry);
			element.innerHTML = '<span class="text">' + targetCountry.name + '</span>'; //country name
			element.className += targetCountry.name;
			//element.span.className += targetCountry.name;
			var object = {
				position: coordinates,
				element: element
			};

			// Add the element to the DOM and add the object to the array
			list.appendChild(element);
			elements[target] = object;
		};

		// Loop through each country line
		var i = 0;
		for (var x = 0; x < allCompanies.length; x++) { //var country in data.countries
			var coordinates = groups.globeDots.geometry.vertices[x];
			pushObject(coordinates, x);
		}
	}

	function positionElements() { // place the label
		var widthHalf = canvas.clientWidth / 2;
		var heightHalf = canvas.clientHeight / 2;
		for (var key in elements) {
			groups.globe.children[0].children[0].rotation.y += -0.00001;
			var targetElement = elements[key];
			var position = getProjectedPosition(widthHalf, heightHalf, targetElement.position); //groups.globeDots.geometry.vertices replace last variable
			// Construct the X and Y position strings
			var positionX = position.x + 'px';
			var positionY = position.y + 'px';
			// Construct the 3D translate string
			var elementStyle = targetElement.element.style;
			elementStyle.webkitTransform = 'translate3D(' + positionX + ', ' + positionY + ', 0)';
			elementStyle.WebkitTransform = 'translate3D(' + positionX + ', ' + positionY + ', 0)'; // Just Safari things (capitalised property name prefix)...
			elementStyle.mozTransform = 'translate3D(' + positionX + ', ' + positionY + ', 0)';
			elementStyle.msTransform = 'translate3D(' + positionX + ', ' + positionY + ', 0)';
			elementStyle.oTransform = 'translate3D(' + positionX + ', ' + positionY + ', 0)';
			elementStyle.transform = 'translate3D(' + positionX + ', ' + positionY + ', 0)';
		}
	}

	/* INTRO ANIMATIONS */
	// Easing reference: https://gist.github.com/gre/1650294
	var easeInOutCubic = function(t) {
		return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
	};

	function introAnimate() {
		if (animations.dots.current <= animations.dots.total) {
			var points = groups.globeDots.geometry.vertices;
			var totalLength = points.length;
			for (var i = 0; i < totalLength; i++) {

				// Get ease value
				var dotProgress = easeInOutCubic(animations.dots.current / animations.dots.total);

				// Add delay based on loop iteration
				dotProgress = dotProgress + (dotProgress * (i / totalLength));
				if (dotProgress > 1) {
					dotProgress = 1;
				}

				// Move the point
				points[i].x = animations.dots.points[i].x * dotProgress;
				points[i].y = animations.dots.points[i].y * dotProgress;
				points[i].z = animations.dots.points[i].z * dotProgress;
			}
			animations.dots.current++;

			// Update verticies
			groups.globeDots.geometry.verticesNeedUpdate = true;
		}
	}



	// Returns an object of 2D coordinates for projected 3D position
	function getProjectedPosition(width, height, position) {
		/*
			Using the coordinates of a country in the 3D space, this function will
			return the 2D coordinates using the camera projection method.
		*/
		position = position.clone();
		var projected = position.project(camera.object);
		return {
			x: (projected.x * width) + width,
			y: -(projected.y * height) + height
		};
	}






/* ------------------------------------ for click manipulation ---------------------------*/

  var clickFn = function(e) {

    var brandLogo = document.getElementById('logoContainer');
    var content = document.getElementById('contentContainer');
    // find the object which is being clicked
    var countryObject;
    var clickedCountry;
    for (var i = 0; i < allCompanies.length; i++) {
      clickedCountry = e.target.innerText;
      if (clickedCountry  == allCompanies[i].name) {
        countryObject = allCompanies[i];
      }
    }

    //clear all curves which have been drawn
    groups.lines.children = [];


	  //update line mesh
	if (e.target.innerText == "Ontario") {
		for (var i = 0; i < allCompanies.length; i++) {
			animatedCurve(countryObject, i);
		}
	} else {
		animatedCurve(countryObject, 0);
	}
	// animate line drawing
	updateCurve();


	$("#sidebar").fadeOut(function(){
		  // shift logo to the corner
		  $("#logoContainer").prependTo("#functions").addClass("logoFixed");
		  $(".logo").css("display","inherit");

		  $("#countryName").text('');
		  $("#companyList").empty();
		  for (var countryIndex = 0; countryIndex < allCompanies.length; countryIndex++){
		    var countryName = allCompanies[countryIndex].name;
		    if (countryName == clickedCountry){
		      $("#countryName").append(countryName);
		      var companyList = allCompanies[countryIndex].children;
		      for (var companyIndex = 0; companyIndex < companyList.length; companyIndex++){
		        var companyObject = companyList[companyIndex];
		        var companyName = companyObject.name;
		        var companyInfo = companyObject.summary;
		        $("#companyList").append("<li><div><h2 class='accordion-toggle'>" + companyName + "</h2><div class='accordion-content'>" +companyInfo+"</div></div></li>");
		      }
		    }
		  }

		// add + sign at the end of company list in the side bar
		$("#companyList .accordion-toggle").each(function(){
			$(this).attr('data-sign','+');
		});
 	 	// add scrolling arrows
		if ($("#companyList li").length >= 13){
			$("#scrollArrows").css("display","block");
		} else {
			$("#scrollArrows").css("display","none");
		}
		// add the svg
		$("#contentContainer svg").css("display", "block")

	}).fadeIn();


  }

  $(".globe-list").on('click', clickFn);

  $("#companyList").on("click", ".accordion-toggle", function(){
      //Expand or collapse this panel
      $(this).next().slideToggle('fast');

      // switch the +/- sign
      $(".accordion-toggle").not($(this)).attr('data-sign', '+');
      if ($(this).attr('data-sign') == "+") {
      	$(this).attr('data-sign',"-");
      } else {
      	$(this).attr('data-sign','+');
      }

      //Hide the other panels
      $(".accordion-content").not($(this).next()).slideUp('fast');


  });

  var clickChangeColor = function(){
    $(this).css("background-color", "#eeff5d");
    $(".globe-list li").not($(this)).css("background-color", "#ffffff");
  };

  $(".globe-list").on("click", "li", clickChangeColor);



  // $("#companyList").on("click", "h2", function(){

  //   if($(this).parent().find('div').css("display") == "none"){
  //     $("#companyList div > div").css("display","none");
  //     $(this).parent().find('div').css("display","block"); //.toggleClass("fadeIn","fadeOut");
  //   } else {
  //     $(this).parent().find('div').css("display","none"); //.toggleClass("fade","fadeIn");
  //   }

  // });

  // stop auto rotation
  var timeoutFn;
  $([$(".globe-canvas"),$(".globe-list")]).each(function(){
    $(this).click(function() {
      camera.controls.autoRotate = false;
      // reset setTimeout when clicked within 5 seconds
      if (timeoutFn != undefined){
        clearTimeout(timeoutFn);
      }
      timeoutFn = setTimeout(function() {
        camera.controls.autoRotate = true; //this is what allows rotation around the globe without DOM element positiong being lost
      }, 30000)
    });
  });

  /* ----- click button to change the background ----- */
  $("#changeBackgroundButton").click(function(){
    console.log($("body").css("background-image"));
    if ($("body").css("background-image") == 'url("http://i67.tinypic.com/2n0r3hg.png")') {
      $("body").css("background-image", 'url(http://www.medi-library.com/salestoolkit/wp-content/uploads/2018/03/wtwig-background-purple.jpg)');
    } else {
      $("body").css("background-image", 'url("http://i67.tinypic.com/2n0r3hg.png")');
    }
  });


  /*----------------- for scrolling arrows in sidebar --------*/
  var timeOutScorll = 0;
  $('#scrollArrows i:nth-child(1)').on('mousedown', function() {
	  timeOutScorll = setInterval(function(){
	  	$('#companyList').animate({
	    	scrollTop: "-=10px"
	  	},10);
      }, 10);
	}).bind('mouseup mouseleave', function() {
    	clearTimeout(timeOutScorll);
	});


  $('#scrollArrows i:nth-child(2)').on('mousedown', function() {
	  timeOutScorll = setInterval(function(){
	  	$('#companyList').animate({
	    	scrollTop: "+=10px"
	  	},10);
      }, 10);
	}).bind('mouseup mouseleave', function() {
    	clearTimeout(timeOutScorll);
	});

    /* -----------------  for full screen mode ------------------*/

  var elem = document.documentElement; // Make the body go full screen.
  $("#changeFullScreenButton").on('click', function () {
    var isInFullScreen = (document.fullscreenElement && document.fullscreenElement !== null) ||
        (document.webkitFullscreenElement && document.webkitFullscreenElement !== null) ||
        (document.mozFullScreenElement && document.mozFullScreenElement !== null) ||
        (document.msFullscreenElement && document.msFullscreenElement !== null);

    // Supports most browsers and their versions.
    var requestMethod;
    if (!isInFullScreen) { // enter fullscreen
      requestMethod = elem.requestFullScreen || elem.webkitRequestFullScreen || elem.mozRequestFullScreen || elem.msRequestFullScreen;
      if (requestMethod) { // Native full screen.
          requestMethod.call(elem);
      } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
          var wscript = new ActiveXObject("WScript.Shell");
          if (wscript !== null) {
              wscript.SendKeys("{F11}");
          }
      }
      $("#changeFullScreenButton").text("Exit Fullscreen");
    } else { // exit fullscreen
      requestMethod = document.exitFullscreen || document.webkitExitFullscreen || document.mozExitFullScreen || document.msExitFullScreen;
      if (requestMethod) { // Native full screen.
          requestMethod.call(document);
      } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
          var wscript = new ActiveXObject("WScript.Shell");
          if (wscript !== null) {
              wscript.SendKeys("{F11}");
          }
      }
      $("#changeFullScreenButton").text("Enter Fullscreen");
    }


  });

  // for responsiveness
  window.onresize = function() {
    checkScreenSize();
  };

  var checkScreenSize = () => {
    var col5 = document.querySelector(".col-xl-5");
    var col7 = document.querySelector(".col-xl-7");
    var width = window.innerWidth;

    width <= 1199 ? col5.parentNode.insertBefore(col7, col5) : col7.parentNode.insertBefore(col5, col7);
    // if (width <= 991) {
    //   col5.parentNode.insertBefore(col7, col5);
    // } else {
    //   col7.parentNode.insertBefore(col5, col7);
  	// }

    var state;
    if (width <= 1000) {
      console.log("sub 1000");
      for (i=0; i < usaStates.length; i++) {
        state = document.querySelector(`.${usaStates[i]} span`);  //document.querySelector(".${usaStates[i]}");
        state.classList.add('hide');
        console.log(state);
      }
    } else {
      for (i=0; i < usaStates.length; i++) {
        state = document.querySelector(`.${usaStates[i]} span`);  //document.querySelector(".${usaStates[i]}");
        state.classList.remove('hide');
      }
    }
  }



	/* INITIALISATION */
	if (!window.WebGLRenderingContext) {
		showFallback();
	} else {
		setupScene();
	}
