/**
 * app.js
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
*/
import { WebGLRenderer, PerspectiveCamera, Vector3 } from 'three';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

import { SeedScene, MenuScene } from 'scenes';
import *  as handlers from './js/handlers.js';
import * as pages from "./js/pages.js";
import './styles.css';
import * as THREE from 'three';
import * as utils from "./js/utils.js"

import { Stars } from './components/objects/Stars'


/************************THREEJS + SCENES *****************************/
// game scene
const scene = new SeedScene();
const camera = new PerspectiveCamera();
// Check pixel density for anit-aliasing
let pixelRatio = window.devicePixelRatio
let AA = true
if (pixelRatio > 1) {
  AA = false
}
console.log(AA)
const renderer = new WebGLRenderer({ powerPreference: "high-performance", antialias: false });
scene.initSky(renderer, camera);
camera.position.set(0, 2, 20);
camera.lookAt(new Vector3(0, 0, 0));

// Set up renderer, canvas, and minor CSS adjustments
renderer.setPixelRatio(window.devicePixelRatio);

const composer = new EffectComposer(renderer);
const afterimagePass = new AfterimagePass(.9);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0, 0, .4);

composer.setSize(window.innerWidth, window.innerHeight);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(afterimagePass);
composer.addPass(bloomPass);


const canvas = renderer.domElement;
canvas.id = 'canvas';
canvas.style.display = 'block'; // Removes padding below canvas
document.body.style.margin = 0; // Removes margin around page
document.body.style.overflow = 'hidden'; // Fix scrolling

//menu scene
const menuScene = new MenuScene();
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
const spaceScore = 0;
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
        scene.reset(character);

        bloomPass.strength = 0;
        speedLevel = 1;
        score_num = 0;
    }
    window.requestAnimationFrame(onAnimationFrameHandler);
    // if on game screen and not paused
    if (!screens["menu"] && !screens["ending"] && !screens["pause"]) {
        frameCounter += 1;
        let chunkManager = scene.getObjectByName('chunkManager');
        chunkManager.update(timeStamp, speedLevel);

        render(chunkManager);
        scene.update && scene.update(timeStamp);

        handlers.handleCollisions(document, scene, character, screens, sounds, score, camera); // needs to happen immediately after update for accuracy
        handlers.handleCharacterControls(scene, keypress, character, camera, speedLevel);
        handlers.updateAudioSpeed(document, sounds, scene);
        handlers.handleSpace(document, bloomPass, sounds, scene, spaceScore, score_num);

        if (frameCounter - lastSpeedUpdate > 450 && speedLevel < 3) {
            speedLevel *= 1.1;
            lastSpeedUpdate = frameCounter;
        }

        if (frameCounter - lastTerrainUpdate > 500 && !chunkManager.state.toSpace) {
            chunkManager.updateBiome(biomes[Math.floor(Math.random() * biomes.length)]);
            lastTerrainUpdate = frameCounter;
        }

        if (!screens["menu"] && !screens["ending"] && !screens["pause"]) {
            if (chunkManager.state.biome == "warp") score_num = Number.POSITIVE_INFINITY;
            else score_num += 0.01;
            score = score_num.toFixed(2);
            handlers.updateScore(document, score)
        }



    }
};
window.requestAnimationFrame(onAnimationFrameHandler);

function render(chunkManager) {
    if (chunkManager.state.biome == "warp") composer.render();
    else renderer.render(scene, camera);

}

// Resize Handler
const windowResizeHandler = () => {
    const { innerHeight, innerWidth } = window;
    renderer.setSize(innerWidth, innerHeight);
    composer.setSize(innerWidth, innerHeight);
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
