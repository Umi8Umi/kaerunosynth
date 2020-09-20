document.addEventListener("DOMContentLoaded", function(event) {

	const keyboardFrequencyMap = {
	    '90': 261.625565300598634,  //Z - C
	    '83': 277.182630976872096, //S - C#
	    '88': 293.664767917407560,  //X - D
	    '68': 311.126983722080910, //D - D#
	    '67': 329.627556912869929,  //C - E
	    '86': 349.228231433003884,  //V - F
	    '71': 369.994422711634398, //G - F#
	    '66': 391.995435981749294,  //B - G
	    '72': 415.304697579945138, //H - G#
	    '78': 440.000000000000000,  //N - A
	    '74': 466.163761518089916, //J - A#
	    '77': 493.883301256124111,  //M - B
	    '81': 523.251130601197269,  //Q - C
	    '50': 554.365261953744192, //2 - C#
	    '87': 587.329535834815120,  //W - D
	    '51': 622.253967444161821, //3 - D#
	    '69': 659.255113825739859,  //E - E
	    '82': 698.456462866007768,  //R - F
	    '53': 739.988845423268797, //5 - F#
	    '84': 783.990871963498588,  //T - G
	    '54': 830.609395159890277, //6 - G#
	    '89': 880.000000000000000,  //Y - A
	    '55': 932.327523036179832, //7 - A#
	    '85': 987.766602512248223,  //U - B
	}

	window.addEventListener('keydown', keyDown, false);
	window.addEventListener('keyup', keyUp, false);
	const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
	var compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, audioCtx.currentTime);

	activeOscillators = {}
	activeGainNodes = {}

	var tabButtons = document.querySelectorAll("button");
	var tabPanels = document.querySelectorAll(".selections");
	const wave = document.getElementById("wave");
	const add = document.getElementById("add");
	const am = document.getElementById("am");
	const fm = document.getElementById("fm");
	var selected = "0";

	wave.addEventListener("click", function(){showPanel(wave.name)}, false);
	add.addEventListener("click", function(){showPanel(add.name)}, false);
	am.addEventListener("click", function(){showPanel(am.name)}, false);
	fm.addEventListener("click", function(){showPanel(fm.name)}, false);
	showPanel(wave.name);

	function keyDown(event) {;
	    const key = (event.detail || event.which).toString();
	    if (keyboardFrequencyMap[key] && !activeOscillators[key]) {
	    	window.document.froggy.src='frog_singing.PNG';
	        if(selected == "0")
	        	playNote(key);
	        else if(selected == "1")
	        	addSynth(key, document.getElementById("Partials").value);
	      	else if(selected == "2")
	      		amSynth(key);
	      	else if(selected == "3")
	      		changeFMcar(key);
	    }
	}

	function keyUp(event) {
	    const key = (event.detail || event.which).toString();
	    //release - removes the 'click'
    	if (keyboardFrequencyMap[key] && activeOscillators[key]) {
    		if(selected == "0"){
	    		activeGainNodes[key].gain.setValueAtTime(activeGainNodes[key].gain.value, audioCtx.currentTime);
				activeGainNodes[key].gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
	        	activeOscillators[key].stop(audioCtx.currentTime + 0.1);
	        }
	        else if(selected == "1" || selected == "2"){
	   			for (var i = 0; i < activeOscillators[key].length; i++) {
					activeGainNodes[key][i].gain.setValueAtTime(activeGainNodes[key][i].gain.value, audioCtx.currentTime);
					activeGainNodes[key][i].gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
		        	activeOscillators[key][i].stop(audioCtx.currentTime + 0.3);
	        	}
			}
        	delete activeOscillators[key];
        	delete activeGainNodes[key];
	    }
	    if (Object.keys(activeOscillators).length === 0 && selected != "3"){
	    	window.document.froggy.src='frog_smile.PNG';
	    }
	}

	function playNote(key) {
	    const osc = audioCtx.createOscillator();
	    osc.frequency.setValueAtTime(keyboardFrequencyMap[key], audioCtx.currentTime)
	    osc.type = document.forms.waveformForm.waveform.value;
	    const gainNode = audioCtx.createGain();
	    gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
		osc.connect(gainNode).connect(audioCtx.destination);
		osc.start();
		activeOscillators[key] = osc;
	    activeGainNodes[key] = gainNode;
		//allows for polyphony by dividing by number of notes and keeping max gain 1
		gainValue = .9/(Object.keys(activeGainNodes).length);
		for (let val of Object.values(activeGainNodes)){
			val.gain.setTargetAtTime(gainValue, audioCtx.currentTime, 0.1);
		}
	  }

	function addSynth(key, partials){
	  	const osc = audioCtx.createOscillator();
		osc.frequency.setValueAtTime(keyboardFrequencyMap[key], audioCtx.currentTime);
	    osc.type = "sine";
	    const gainNode = audioCtx.createGain();
	    gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
		gainNode.connect(compressor).connect(audioCtx.destination);
	  	osc.connect(gainNode);
	  	osc.start();
		activeOscillators[key] = [osc];
		activeGainNodes[key] = [gainNode];
		gainNode.gain.setTargetAtTime(.3, audioCtx.currentTime, 0.1);
	  	for(var i = 0; i < partials; i++){
		  	const osc1 = audioCtx.createOscillator();
		    osc1.frequency.setValueAtTime(keyboardFrequencyMap[key]*i, audioCtx.currentTime);
		    osc1.type = "sine";
		    const gainNode1 = audioCtx.createGain();
		    gainNode1.gain.setValueAtTime(0.01, audioCtx.currentTime);
			gainNode1.connect(gainNode);			
			osc1.connect(gainNode1);
			osc1.start();
			activeOscillators[key].push(osc1);
			activeGainNodes[key].push(gainNode1);
		    gainNode1.gain.setTargetAtTime(partials/10, audioCtx.currentTime, 0.1); //.1 then .2 then .5 then .7
		}
	}

	function amSynth(key){
	  	var carrier = audioCtx.createOscillator();
	    var modulatorFreq = audioCtx.createOscillator();
	    if(document.getElementById("lfo").checked == true)
	    	modulatorFreq.frequency.value = 1;
	    else
	    	modulatorFreq.frequency.value = 100;
	    carrier.frequency.setValueAtTime(keyboardFrequencyMap[key], audioCtx.currentTime);

	    const globalGain = audioCtx.createGain();
	    globalGain.gain.setValueAtTime(0.01, audioCtx.currentTime);
	    globalGain.gain.setTargetAtTime(0.9, audioCtx.currentTime, 0.1);

	    const modulated = audioCtx.createGain();
	    const depth = audioCtx.createGain();
	    depth.gain.setValueAtTime(0.01, audioCtx.currentTime);
	    modulated.gain.setValueAtTime(0.01, audioCtx.currentTime);
	    depth.gain.setTargetAtTime(0.5, audioCtx.currentTime, 0.1);
	    modulated.gain.setTargetAtTime(0.9 - depth.gain.value, audioCtx.currentTime, 0.1);

	    modulatorFreq.connect(depth).connect(modulated.gain);
	    carrier.connect(modulated)
	    modulated.connect(globalGain).connect(compressor).connect(audioCtx.destination);
	    
	    carrier.start();
	    modulatorFreq.start();
	    activeOscillators[key] = [carrier, modulatorFreq];
		activeGainNodes[key] = [globalGain, modulated, depth];
	}

	var modulatorFreq;
	var modulationIndex;
	var carrier;
	var audioCtxFM;
	var gainNode;

	function fmSynth() {
		audioCtxFM = new (window.AudioContext || window.webkitAudioContext);
	    var compressorFM = audioCtxFM.createDynamicsCompressor();
    	compressorFM.threshold.setValueAtTime(-50, audioCtx.currentTime);

	    carrier = audioCtxFM.createOscillator();
	    modulatorFreq = audioCtxFM.createOscillator();

	    gainNode = audioCtxFM.createGain();
	    gainNode.gain.setValueAtTime(0.01, audioCtxFM.currentTime);
		gainNode.connect(compressorFM).connect(audioCtxFM.destination);	    

	    modulationIndex = audioCtxFM.createGain();
	    modulationIndex.gain.value = 100;
	    modulatorFreq.frequency.value = 100;

	    gainNode.gain.setTargetAtTime(1.0, audioCtxFM.currentTime, 0.1);

	    modulatorFreq.connect(modulationIndex);
	    modulationIndex.connect(carrier.frequency)
	    
	    carrier.connect(gainNode);

	    carrier.start();
	    modulatorFreq.start();

	    activeOscillatorsFM = {modulatorFreq, carrier};
	}

	function changeFMcar(val){
		carrier.frequency.value = val;
	}
	function updateFreq(val) {
	    modulatorFreq.frequency.value = Math.floor(val);
	};
	function updateIndex(val) {
	    modulationIndex.gain.value = Math.floor(val);
	};

	document.getElementById('updateFreq').addEventListener('change', function(){updateFreq(this.value)}, false);
	document.getElementById('updateIndex').addEventListener('change', function(){updateIndex(this.value)}, false);
	document.getElementById('updateFreq').addEventListener('input', function(){updateFreq(this.value)}, false);
	document.getElementById('updateIndex').addEventListener('input', function(){updateIndex(this.value)}, false);

	const playButton = document.getElementById('playButton');
	playButton.addEventListener('click', function() {
	    if(!audioCtxFM){
	    	playButton.innerText = "STOP";
	    	document.getElementById('sliders').style.display="inline-block";
	    	window.document.froggy.src='frog_singing.PNG';
	        fmSynth();
	        return;
		}
	    if (audioCtxFM.state === 'suspended') {
	    	playButton.innerText = "STOP";
	    	document.getElementById('sliders').style.display="inline-block";
	    	window.document.froggy.src='frog_singing.PNG';
	    	audioCtxFM.resume();
	    	gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtxFM.currentTime);
	    	gainNode.gain.setTargetAtTime(1.0, audioCtxFM.currentTime, 0.01);
	    }
	    if (audioCtxFM.state === 'running') {
	    	playButton.innerText = "PLAY";
	    	document.getElementById('sliders').style.display="none";
	    	window.document.froggy.src='frog_smile.PNG';
	    	gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtxFM.currentTime);
	    	gainNode.gain.setTargetAtTime(0.0001, audioCtxFM.currentTime, 0.01);
	        setTimeout(function(){ audioCtxFM.suspend(); }, 100);
	    }

	}, false);

	function showPanel(panelIndex){
		selected = panelIndex;
		tabButtons.forEach(function(tab){
			tab.style.backgroundColor="";
			tab.style.color="";
		});
		tabButtons[panelIndex].style.backgroundColor="#95D7FF";
		tabButtons[panelIndex].style.color="#E86DD0";
		tabPanels.forEach(function(tab){
			tab.style.display="none";
		});
		tabPanels[panelIndex].style.display="block";
		tabPanels[panelIndex].style.backgroundColor="#95D7FF";
		tabPanels[panelIndex].style.color="#E86DD0";
	}

}, false);

