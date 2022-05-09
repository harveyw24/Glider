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
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

import { SeedScene, MenuScene } from 'scenes';
import *  as handlers from './js/handlers.js';
import * as pages from "./js/pages.js";
import './styles.css';
import * as THREE from 'three';
import * as utils from "./js/utils.js"


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
const renderer = new WebGLRenderer({ powerPreference: "high-performance", antialias: AA });
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
const sounds = {};
const whirring = new THREE.Audio(listener);
const damage = new THREE.Audio(listener);
const powerup = new THREE.Audio(listener);
const explosion = new THREE.Audio(listener);
sounds.whirring = whirring;
sounds.damage = damage;
sounds.powerup = powerup;
sounds.explosion = explosion;

const audioLoader = new THREE.AudioLoader();
audioLoader.load('https://raw.githubusercontent.com/harveyw24/Glider/main/src/sounds/explosion.wav', function(buffer) {
    explosion.setBuffer(buffer);
    explosion.setLoop(false);
});
audioLoader.load('https://raw.githubusercontent.com/harveyw24/Glider/main/src/sounds/whirring.wav', function(buffer) {
    whirring.setBuffer(buffer);
    whirring.setLoop(true);
});
audioLoader.load('https://raw.githubusercontent.com/harveyw24/Glider/main/src/sounds/damage.wav', function(buffer) {
    damage.setBuffer(buffer);
    damage.setLoop(false);
});
audioLoader.load('https://raw.githubusercontent.com/harveyw24/Glider/main/src/sounds/powerup.wav', function(buffer) {
    powerup.setBuffer(buffer);
    powerup.setLoop(false);
});

/**************************OTHER GLOBAL VARIABLES**********************/

// Gamestate container
const GS = {
    initialize() {
        this.document = document;
        this.camera = camera;
        this.menuCamera = menuCamera;

        this.renderer = renderer;
        this.menuRenderer = menuRenderer;
        this.composer = composer;
        this.bloomPass = bloomPass;

        this.canvas = canvas;
        this.menuCanvas = menuCanvas;

        this.menuScene = menuScene;
        this.scene = scene;

        this.spaceScore = 150;
        this.score_max = this.spaceScore + 50;
        this.keypress = {};
        this.screens = { "menu": true, "ending": false, "pause": false };
        this.sounds = sounds;
        this.character = 'plane';
        for (const [_, sound] of Object.entries(this.sounds)) sound.play();
        this.reset();
    },
    reset() {
        this.frameCounter = 0;
        this.lastSpeedUpdate = 0;
        this.lastTerrainUpdate = 0;
        this.speedLevel = 1;
        this.score_num = 0;


        this.scene.reset(this.character);

        for (const [_, sound] of Object.entries(this.sounds)) sound.stop();
        this.sounds.powerup.setVolume(0.6);
        this.sounds.damage.setVolume(0.6);
        this.sounds.whirring.setVolume(0.4);
        this.sounds.explosion.setVolume(0.3);

        this.bloomPass.strength = 0;
    }
}


GS.initialize();

/**************************RENDER LOOP*********************************/
// Render loop
const onAnimationFrameHandler = (timeStamp) => {
    // reset the game on menu screen
    if (GS.screens['menu']) {
        GS.menuRenderer.render(GS.menuScene, GS.menuCamera)
        GS.reset();
    }
    window.requestAnimationFrame(onAnimationFrameHandler);
    // if on game screen and not paused
    if (!GS.screens["menu"] && !GS.screens["ending"] && !GS.screens["pause"]) {
        GS.frameCounter += 1;
        let chunkManager = GS.scene.getObjectByName('chunkManager');
        chunkManager.update(timeStamp, GS.speedLevel);

        GS.scene.update && GS.scene.update(timeStamp);
        render(chunkManager);

        // TODO: fix score handling
        handlers.handleCollisions(GS); // needs to happen immediately after update for accuracy
        handlers.handleCharacterControls(GS);
        handlers.updateAudioSpeed(GS);
        handlers.handleSpace(GS);

        if (GS.frameCounter - GS.lastSpeedUpdate > 450 && GS.speedLevel < 3) {
            GS.speedLevel *= 1.1;
            GS.lastSpeedUpdate = GS.frameCounter;
        }

        if (GS.frameCounter - GS.lastTerrainUpdate > 500 && !chunkManager.state.toSpace) {
            chunkManager.updateBiome(biomes[Math.floor(Math.random() * biomes.length)]);
            GS.lastTerrainUpdate = GS.frameCounter;
        }

        if (!GS.screens["menu"] && !GS.screens["ending"] && !GS.screens["pause"]) {
            if (GS.score_num < GS.score_max) GS.score_num += 0.01;
            else GS.score_num = GS.score_max;
            GS.score = GS.score_num.toFixed(2);
            handlers.updateScore(document, GS.score)
        }



    }
};
window.requestAnimationFrame(onAnimationFrameHandler);

function render(chunkManager) {
    if (chunkManager.state.biome == "warp") GS.composer.render();
    else GS.renderer.render(GS.scene, GS.camera);
}

// Resize Handler
const windowResizeHandler = () => {
    const { innerHeight, innerWidth } = window;
    GS.renderer.setSize(innerWidth, innerHeight);
    GS.composer.setSize(innerWidth, innerHeight);
    GS.camera.aspect = innerWidth / innerHeight;
    GS.camera.updateProjectionMatrix();

    GS.menuRenderer.setSize(innerWidth, innerHeight);
    GS.menuCamera.aspect = innerWidth / innerHeight;
    GS.menuCamera.updateProjectionMatrix();
};
windowResizeHandler();
window.addEventListener('resize', windowResizeHandler, false);

/**************************EVENT LISTENERS*****************************/
window.addEventListener('keydown', event => handlers.handleKeyDown(event, GS.keypress), false);
window.addEventListener('keyup', event => handlers.handleKeyUp(event, GS.keypress), false);
window.addEventListener('keydown', event => handlers.handleScreens(GS, event));

/****************************INIT HTML*********************************/
pages.init_fonts(document);
pages.init_page(document, menuCanvas);
