/**
 * app.js
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
*/
import { WebGLRenderer, PerspectiveCamera, Vector3 } from 'three';
import { SeedScene, MenuScene } from 'scenes';
import *  as handlers from './js/handlers.js';
import * as pages from "./js/pages.js";
import './styles.css';
import * as THREE from 'three';
import * as utils from "./js/utils.js"



/************************THREEJS + SCENES *****************************/
// game scene
let scene = new SeedScene();
const camera = new PerspectiveCamera();
const renderer = new WebGLRenderer({ powerPreference: "high-performance", antialias: true });
scene.initSky(renderer, camera);
camera.position.set(0, 2, 20);
camera.lookAt(new Vector3(0, 0, 0));

// Set up renderer, canvas, and minor CSS adjustments
renderer.setPixelRatio(window.devicePixelRatio);
const canvas = renderer.domElement;
canvas.id = 'canvas';
canvas.style.display = 'block'; // Removes padding below canvas
document.body.style.margin = 0; // Removes margin around page
document.body.style.overflow = 'hidden'; // Fix scrolling

//menu scene
let menuScene = new MenuScene();
const menuCamera = new PerspectiveCamera();
const menuRenderer = new WebGLRenderer({ antialias: true });
menuScene.initSky(menuRenderer, camera);
menuCamera.position.set(-0.5, 0.5, -3)
menuCamera.lookAt(new Vector3(-2, 0.5, 0))

menuRenderer.setPixelRatio(window.devicePixelRatio);
const menuCanvas = menuRenderer.domElement;
menuCanvas.id = 'menuCanvas';
menuCanvas.style.display = 'block'; // Removes padding below canvas

const biomes = utils.generateBiomes();
/****************************AUDIO*************************************/
const listener = new THREE.AudioListener();
camera.add(listener);
const sounds = [];
const whirring = new THREE.Audio(listener);
const damage = new THREE.Audio(listener);
const powerup = new THREE.Audio(listener);
const explosion = new THREE.Audio(listener);
sounds['whirring'] = whirring;
sounds['damage'] = damage;
sounds['powerup'] = powerup;
sounds['explosion'] = explosion;

const audioLoader = new THREE.AudioLoader();
audioLoader.load('https://raw.githubusercontent.com/harveyw24/Glider/main/src/sounds/explosion.wav', function(buffer) {
    explosion.setBuffer(buffer);
    explosion.setLoop(false);
    explosion.setVolume(0.3);
});

audioLoader.load('https://raw.githubusercontent.com/harveyw24/Glider/main/src/sounds/whirring.wav', function(buffer) {
    whirring.setBuffer(buffer);
    whirring.setLoop(true);
    whirring.setVolume(0.4);
});

audioLoader.load('https://raw.githubusercontent.com/harveyw24/Glider/main/src/sounds/whirring.wav', function(buffer) {
    whirring.setBuffer(buffer);
    whirring.setLoop(true);
    whirring.setVolume(0.4);
});

audioLoader.load('https://raw.githubusercontent.com/harveyw24/Glider/main/src/sounds/damage.wav', function(buffer) {
    damage.setBuffer(buffer);
    damage.setLoop(false);
    damage.setVolume(0.6);
});
audioLoader.load('https://raw.githubusercontent.com/harveyw24/Glider/main/src/sounds/powerup.wav', function(buffer) {
    powerup.setBuffer(buffer);
    powerup.setLoop(false);
    powerup.setVolume(0.6);
});
/**************************OTHER GLOBAL VARIABLES**********************/
let frameCounter = 0;
let lastSpeedUpdate = 0;
let lastTerrainUpdate = 0;
let speedLevel = 1;
const spaceScore = 300;
const keypress = {};
const screens = { "menu": true, "ending": false, "pause": false };
const character = 'plane';
let score;
let score_num = 0;

/**************************RENDER LOOP*********************************/
// Render loop
const onAnimationFrameHandler = (timeStamp) => {
    // reset the game on menu screen
    if (screens['menu']) {
        menuRenderer.render(menuScene, menuCamera)
        let plane = scene.getObjectByName(character);
        let chunkManager = scene.getObjectByName('chunkManager');
        plane.position.x = 0;
        plane.position.y = 0;
        plane.position.z = 0;
        plane.rotation.z = 0;
        plane.rotation.x = 0;
        plane.state.hit = false;
        speedLevel = 1;
        chunkManager.position.y = 0;
        chunkManager.state.toSpace = false;
        chunkManager.state.spaceRewardHeight = 0;
        chunkManager.state.falling = 0;
        chunkManager.state.climbing = 0;
        if (chunkManager.state.biome != "default") chunkManager.resetBiome();

        score_num = 0;
    }
    window.requestAnimationFrame(onAnimationFrameHandler);
    // if on game screen and not paused
    if (!screens["menu"] && !screens["ending"] && !screens["pause"]) {
        frameCounter += 1;
        let chunkManager = scene.getObjectByName('chunkManager');
        chunkManager.update(timeStamp, speedLevel);

        renderer.render(scene, camera);
        scene.update && scene.update(timeStamp);

        handlers.handleCollisions(document, scene, character, screens, sounds, score, camera); // needs to happen immediately after update for accuracy
        handlers.handleCharacterControls(scene, keypress, character, camera, speedLevel);
        handlers.updateAudioSpeed(document, sounds, scene);

        if (frameCounter - lastSpeedUpdate > 450 && speedLevel < 3) {
            speedLevel *= 1.1;
            lastSpeedUpdate = frameCounter;
        }

        if (frameCounter - lastTerrainUpdate > 500 && !chunkManager.state.toSpace) {
            chunkManager.updateBiome(biomes[Math.floor(Math.random() * biomes.length)]);
            lastTerrainUpdate = frameCounter;
        }

        if (!screens["menu"] && !screens["ending"] && !screens["pause"]) {
            score_num += 0.01;
            score = score_num.toFixed(2);
            handlers.updateScore(document, score)
        }


        if (score > spaceScore && !chunkManager.state.toSpace) {
            chunkManager.updateBiome(utils.space_biome);
            pages.space(document)
        }
        if (chunkManager.state.toSpace) {
            const message = document.getElementById("message");
            const thresholdTexts = [
                [spaceScore + 80, "Ending song: \"interstellar railway\" by Louie Zong"],
                [spaceScore + 70, ""],
                [spaceScore + 60, "Congratulations."],
                [spaceScore + 45, ""],
                [spaceScore + 35, "You have ascended."],
                [spaceScore + 30, "Against all odds..."],
                [spaceScore + 25, "...and you dodged the treacherous volcanoes and survived the towering arctic icebergs."],
                [spaceScore + 20, "...You wove through the peaks of the stone forest, persevered through the deserts..."],
                [spaceScore + 15, "You conquered the mountains, breezed over the grasslands..."],
            ]
            for (const thresholdText of thresholdTexts) {
                const threshold = thresholdText[0];
                const text = thresholdText[1];
                if (score > threshold) {
                    if (message.innerHTML != text) message.innerHTML = text;
                    break;
                }
            }
            if (score > spaceScore + 10) {
                const victorySong = document.getElementById('victory-song');
                if (victorySong.paused) victorySong.play();

            }
            if (score > spaceScore) {
                const audio = document.getElementById('audio');
                if (audio.volume > 0 || sounds["powerup"] > 0) {
                    const delta = 0.001;
                    const fadeAudio = setInterval(function() {
                        audio.volume = Math.max(0.0, audio.volume - delta);
                        sounds["powerup"].setVolume(Math.max(0.0, sounds["powerup"].getVolume() - delta))
                        if (audio.volume == 0.0 && sounds["powerup"].getVolume() == 0.0) clearInterval(fadeAudio);
                    }, 200);
                }
                else {
                    audio.pause();
                    sounds["powerup"].pause();
                    sounds['whirring'].setVolume(0.4);
                }
            }
        }

    }
};
window.requestAnimationFrame(onAnimationFrameHandler);

// Resize Handler
const windowResizeHandler = () => {
    const { innerHeight, innerWidth } = window;
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();

    menuRenderer.setSize(innerWidth, innerHeight);
    menuCamera.aspect = innerWidth / innerHeight;
    menuCamera.updateProjectionMatrix();
};
windowResizeHandler();
window.addEventListener('resize', windowResizeHandler, false);

/**************************EVENT LISTENERS*****************************/
window.addEventListener('keydown', event => handlers.handleKeyDown(event, keypress), false);
window.addEventListener('keyup', event => handlers.handleKeyUp(event, keypress), false);
window.addEventListener('keydown', event => handlers.handleScreens(event, screens, document, canvas, character, scene, menuCanvas, sounds, score));

/****************************INIT HTML*********************************/
pages.init_fonts(document);
pages.init_page(document, menuCanvas);
