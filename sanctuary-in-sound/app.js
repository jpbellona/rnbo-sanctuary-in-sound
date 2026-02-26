/*
*	Clean version of GRNMS 8x8 pixel map web interactive
* earcons + map
*
*/

//global vars to share between RNBO and P5JS
let x;
let y;
let device; // Global variable to hold the RNBO device for p5js to send vars to
let activeHabitat;
let lastSentIndex = null;    // remember last cell we sent

//p5 inside a div container on the html
const p5Container = document.getElementById("p5-pixel-map");
let w = p5Container.clientWidth;
let h = p5Container.clientHeight;

let canvasSize = 500;
let gridCount = 8;
//let cellSize = canvasSize / gridCount;
let cellSize = w / gridCount;

//no k-means color checker. hard coded for particular map.
let denseCells = [17, 18, 25, 39, 40, 47, 63]; // dense habitat cells in 8x8 pixel map
let sparseCells = [20, 26, 27, 28, 34, 35, 48, 53, 54, 55, 56, 61, 62, 64];
let flatCells = [9, 10, 11, 12, 19, 21, 24, 29, 37, 38, 41, 42, 45, 46, 49, 57];
let rippledCells = [1, 2, 3, 4, 5, 6, 7, 8, 13, 14, 15, 16, 22, 23, 30, 31, 32, 33, 36, 43, 44, 50, 51, 52, 58, 59, 60]; 
const groups = [denseCells, sparseCells, flatCells, rippledCells];


const densebufferId1 = "h1"; //we have a [buffer~ my_sample] object in our patch
const densebufferId2 = "h2";
const densebufferId3 = "h3";
const densebufferId4 = "h4";

//p5
//semi-standard p5.js setup
async function setup() {
	//HTML stuff
	let cnvs = createCanvas(w, w); //use 
	//https://www.perplexity.ai/search/one-page-web-development-im-lo-5qpzRhynRtu_JHB1Xr_s2g
	cnvs.parent(p5Container) //DOM node (p5Container) OR div id="#p5-pixel-map"
	cnvs.style('position', 'absolute');
	cnvs.style('inset', 0);
	// cnvs.style('z-index', -1); //-1 removes mouseOut functionality
	cnvs.mouseOut(handleMouseOut); //this is to know when user leaves canvas


	pixelmap = await loadImage("media/8x8_500pixels.jpg")

	//noCursor(); // no mouse
	colorMode(HSB, 360, 100, 100); //hue saturation brightness
	//rectMode(CENTER);
  stroke(0);  				// grid line color (black)
  noFill();          	// cells will be empty rectangles
}

function windowResized() {
	w = p5Container.clientWidth;
	cellSize = w / gridCount;
	// h = p5Container.clientHeight;
	resizeCanvas(w, w);
}


//	RNBO
// Create AudioContext
const WAContext = window.AudioContext || window.webkitAudioContext;
const context = new WAContext();

const setupRNBO = async () => {
	const patchExportURL = "patch.export.json";

	// Create gain node and connect it to audio output
	const gainNode = context.createGain();
	gainNode.connect(context.destination);

	// Fetch the exported patcher
	let response, patcher;
	try {
		response = await fetch(patchExportURL);
		patcher = await response.json();

	} catch (err) {
	const errorContext = {
	  error: err
	};

	if (response && (response.status >= 300 || response.status < 200)) {
	  (errorContext.header = `Couldn't load patcher export bundle`),
	    (errorContext.description =
	      `Check app.js to see what file it's trying to load. Currently it's` +
	      ` trying to load "${patchExportURL}". If that doesn't` +
	      ` match the name of the file you exported from RNBO, modify` +
	      ` patchExportURL in app.js.`);
	}
	if (typeof guardrails === "function") {
	  guardrails(errorContext);
	} else {
	  throw err;
	}
	return;
	}

	// Create the device
	// let device; //this is where you can get parameters in max rnbo patch
	try {
	device = await RNBO.createDevice({ context, patcher });
	// rnboDevice = device;
	// rnboDevice.node.connect(context.destination);
	device.node.connect(context.destination); //this allows it to pass to global context for p5JS
	} catch (err) {
	if (typeof guardrails === "function") {
	  guardrails({ error: err });
	} else {
	  throw err;
	}
	return;
	}


	// Connect the device to other web audio nodes
  device.node.connect(gainNode);
  // This connects the RNBO device to the gain node, which is connected to audio output. Now sound
	// coming from the RNBO device should reach the speakers.

  // Print the names of all the top-level parameters in the device.
	device.parameters.forEach(parameter => {
	  console.log("id " + parameter.id);
	  // console.log("name " + parameter.name);
	});

  	// start audio with a button
	context.suspend();
	document.getElementById("start-button").onclick = (e) => {
	if (document.getElementById("start-button").innerHTML == "Start Audio") {
	  context.resume();
	  document.getElementById("start-button").innerHTML = "Stop Audio";
	} else {
	  context.suspend();
	  document.getElementById("start-button").innerHTML = "Start Audio";
	}};

	// start audio with clicking the body of the webpage
	// document.body.onclick = () => {
	//     context.resume();
	// }

	// Skip if you're not using guardrails.js
	if (typeof guardrails === "function") guardrails();


	const param = device.parametersById.get("habitat");
	// With ParameterNotificationSetting.All, the device AND the parameter emit an event when we change the value
	param.changeEvent.subscribe((v) => {
		// console.log(`ChangeEvent y: ${v}`);
	});

	//Audio BUFFERs and File Dependencies

	// descriptions is of type ExternalDataInfo[]
	const descriptions = device.dataBufferDescriptions;
	// Each description will have a unique id, as well as a "file" or "url" key, depending on whether 
	// the buffer references a local file or a remote URL
	descriptions.forEach(desc => {
	    if (!!desc.file) {
	        console.log(`Buffer with id ${desc.id} references file ${desc.file}`);
	    } else {
	        console.log(`Buffer with id ${desc.id} references remote URL ${desc.url}`);
	    }
	});

	// Load our samples as ArrayBuffers;
	const fileResponse = await fetch("Dense.wav"); //wav is better for all browsers
	const arrayBuf = await fileResponse.arrayBuffer();

	// Decode the received Data as an AudioBuffer
	const audioBuf = await context.decodeAudioData(arrayBuf);

	// Set the DataBuffer on the device
	await device.setDataBuffer(densebufferId1, audioBuf); //see global bufferId var.

	const fileResponse2 = await fetch("Sparse.wav");
	const arrayBuf2 = await fileResponse2.arrayBuffer();
	const audioBuf2 = await context.decodeAudioData(arrayBuf2);
	await device.setDataBuffer(densebufferId2, audioBuf2);

	const fileResponse3  = await fetch("Flat.wav");
	const arrayBuf3 = await fileResponse3.arrayBuffer();
	const audioBuf3 = await context.decodeAudioData(arrayBuf3);
	await device.setDataBuffer(densebufferId3, audioBuf3);

	const fileResponse4 = await fetch("Rippled.wav");
	const arrayBuf4 = await fileResponse4.arrayBuffer();
	const audioBuf4 = await context.decodeAudioData(arrayBuf4);
	await device.setDataBuffer(densebufferId4, audioBuf4);


	//I may need to connect the device to the audio out AFTER loading audio file???
	//e.g. device.node.connect(context.destination);
	device.node.connect(context.destination);

}

// We can't await an asynchronous function at the top level, so we create an asynchronous
// function setup, and then call it without waiting for the result.
setupRNBO();


//p5 sketch
function draw() {

	background(255);   // clear to white each frame
	image(pixelmap,0,0,w,w); //using width twice to get square

  for (let row = 0; row < gridCount; row++) {
    for (let col = 0; col < gridCount; col++) {
      let x = col * cellSize;
      let y = row * cellSize;
      rect(x, y, cellSize, cellSize);
    }
  }

  // (optional) show current cell index for debugging
  let idx = getHoveredCellIndex();
  if (idx !== null) {
  	// console.log("Hover index:", idx);

  	//let val = isDenseCell(idx);       // 1 if match, 0 if not

  	//great for finding out colors in grid
    // fill(0);
    // noStroke();
    // textSize(20);
    // text("Cell: " + idx, 10, 20); //height - 20
    // noFill();
    // stroke(0);
  }


	//functions using parameters inside the RNBO patch go here
	if (device) {
		handleHoverChange(); //check to see if mouse hover over grid/cell changed.

		//this is what passes on to RNBO device
		//webAudio values can ONLY be between 0-1.
		// if (y) {
		// 	y.normalizedValue = yValue;
		// }
		// if (x) {
		// 	x.normalizedValue = xValue;
		// }
	}
	

}

function getHoveredCellRC() {
  // Only consider positions inside the canvas
  if (mouseX < 0 || mouseX >= width || mouseY < 0 || mouseY >= height) {
    return null;
  }

  let col = Math.floor(mouseX / cellSize); // 0–7
  let row = Math.floor(mouseY / cellSize); // 0–7

  return { row, col };
}

function getHoveredCellIndex() {
  const rc = getHoveredCellRC();
  if (!rc) return null;

  let { row, col } = rc;
  let index = row * gridCount + col + 1; // 1–64
  return index;
}

// Function to check the hovered cell index
// This takes an index (1–64) and returns 1 if it is in dense Habitat, otherwise 0:
function isDenseCell(index) {
  if (index === null) return 0;
  return denseCells.includes(index) ? 1 : 0;
}

function getGroupForIndex(idx) {
  for (let i = 0; i < groups.length; i++) {
    if (groups[i].includes(idx)) { // includes() checks membership [web:10][web:5]
      //return groupNames[i];       // or return i, or the actual array: groups[i]
      return i;
    }
  }
  return null; // not found in any group
}

//Function that sends data only when the cell changes
function handleHoverChange() {
  let idx = getHoveredCellIndex();

  if (idx === lastSentIndex) {
    return; // no change, do nothing
  }

  lastSentIndex = idx;

  if (idx === null) {
    // Optional: handle "no cell" state here
    return;
  }

  //let val = isDenseCell(idx);
  //
  const group = getGroupForIndex(idx);
  if (group !== null) {
    //console.log("Index", idx, "is in group", group);
    // do whatever behavior you want here
  }

  //send values to RNBO
  sendToRNBO(idx, group);

  //to delete this
  //console.log("Changed cell:", idx, "habitat_num:", group);
  activeHabitat = group;
}

function handleMouseOut() {
	//4 inside RNBO patch will turn off audio.
	let idx = getHoveredCellIndex();
  group = 4;  // whenever mouse leaves the canvas
  sendToRNBO(idx, group);
}

// RNBO integration
function sendToRNBO(index, habitat_num) {
  // TODO: replace with RNBO device messaging
  device.parametersById.get('habitat').value = habitat_num;
}

