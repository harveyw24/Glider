/**
 * app.js
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
*/
import { WebGLRenderer, PerspectiveCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SeedScene, MenuScene } from 'scenes';
import { ChunkManager } from "objects"
import *  as handlers from './js/handlers.js';
import * as pages from "./js/pages.js";
import './styles.css';
import * as THREE from 'three';


const default_biome = {}
const desert_biome = {
    waterColor: new THREE.Color(97, 32, 13),
    bankColor: new THREE.Color(97, 32, 13),
    middleColor: new THREE.Color(232, 161, 90),
    peakColor: new THREE.Color(252, 203, 78),
    exaggeration: 10,
    freq: 4,
    maxObstacleNum: 10,
    obstacle: "cactus",
}
const volcano_biome = {
    waterColor: new THREE.Color(100, 0, 0),
    bankColor: new THREE.Color(0, 0, 0),
    middleColor: new THREE.Color(0, 0, 0),
    peakColor: new THREE.Color(242, 64, 24),
    exaggeration: 27,
    freq: 3,
    maxObstacleNum: 0,
}
const grassland_biome = {
    waterColor: new THREE.Color(0, 127, 255),
    bankColor: new THREE.Color(34, 139, 34),
    middleColor: new THREE.Color(154, 205, 50),
    peakColor: new THREE.Color(223, 255, 0),
    exaggeration: 15,
    freq: 1,
    maxObstacleNum: 20,
    obstacle: "sheep",
}
const arctic_biome = {
    waterColor: new THREE.Color(1, 12, 48),
    bankColor: new THREE.Color(39, 168, 247),
    middleColor: new THREE.Color(152, 212, 255),
    peakColor: new THREE.Color(209, 225, 255),
    exaggeration: 40,
    freq: 2,
    maxObstacleNum: 20,
    rewardHeightMax: 200,
    obstacle: "penguin",
    obstacleHeightMax: 3,
    obstacleHeightMin: 0,
    maxRewardNum: 15,
}
const stone_biome = {
    waterColor: new THREE.Color(5, 78, 5),
    bankColor: new THREE.Color(54, 82, 54),
    middleColor: new THREE.Color(223, 175, 115),
    peakColor: new THREE.Color(55, 46, 29),
    exaggeration: 30,
    freq: 8,
    octaves: 1,
    colorWiggle: -1,
    middleGradient: .8,
    gamma: 5,
    smoothPeaks: true,
    rewardHeightMax: 40,
    maxObstacleNum: 25,
    obstacle: "tree",
}
const space_biome = {
    waterColor: new THREE.Color(0, 0, 0),
    bankColor: new THREE.Color(0, 0, 0),
    middleColor: new THREE.Color(0, 0, 0),
    peakColor: new THREE.Color(0, 0, 0),
    exaggeration: 0,
    toSpace: true,
    maxObstacleNum: 0,
}

const biomes = [default_biome, desert_biome, volcano_biome, grassland_biome, arctic_biome, stone_biome];
// const biomes = [default_biome, arctic_biome];


// Initialize core ThreeJS components
let scene = new SeedScene();
const camera = new PerspectiveCamera();
const renderer = new WebGLRenderer({ powerPreference: "high-performance", antialias: true });
const listener = new THREE.AudioListener();

let menuScene = new MenuScene();
const menuCamera = new PerspectiveCamera();
const menuRenderer = new WebGLRenderer({ antialias: true });


camera.add(listener);
const sounds = [];
// const menu = new THREE.Audio(listener);
const whirring = new THREE.Audio(listener);
const damage = new THREE.Audio(listener);
const powerup = new THREE.Audio(listener);
const explosion = new THREE.Audio(listener);
//  sounds['menu'] = menu;
sounds['whirring'] = whirring;
sounds['damage'] = damage;
sounds['powerup'] = powerup;
sounds['explosion'] = explosion;

let frameCounter = 0;
let lastSpeedUpdate = 0;
let lastTerrainUpdate = 0;
let speedLevel = 1;

scene.initSky(renderer, camera);
menuScene.initSky(menuRenderer, camera);

const audioLoader = new THREE.AudioLoader();
audioLoader.load('src/sounds/explosion.wav', function(buffer) {
    explosion.setBuffer(buffer);
    explosion.setLoop(false);
    explosion.setVolume(0.3);
});

audioLoader.load('src/sounds/whirring.wav', function(buffer) {
    whirring.setBuffer(buffer);
    whirring.setLoop(true);
    whirring.setVolume(0.4);
});

audioLoader.load('src/sounds/whirring.wav', function(buffer) {
    whirring.setBuffer(buffer);
    whirring.setLoop(true);
    whirring.setVolume(0.4);
});

audioLoader.load('src/sounds/damage.wav', function(buffer) {
    damage.setBuffer(buffer);
    damage.setLoop(false);
    damage.setVolume(0.6);
});
audioLoader.load('src/sounds/powerup.wav', function(buffer) {
    powerup.setBuffer(buffer);
    powerup.setLoop(false);
    powerup.setVolume(0.6);
});

// Initialize global variables
const keypress = {};
const screens = { "menu": true, "ending": false, "pause": false };
const character = 'plane';
let score;
let score_num = 0;
let oldTime = 0;
let terrainOldTime = 0;

// Set up camera
camera.position.set(0, 2, 20);
camera.lookAt(new Vector3(0, 0, 0));

menuCamera.position.set(-0.5, 0.5, -3)
menuCamera.lookAt(new Vector3(-2, 0.5, 0))

// Set up renderer, canvas, and minor CSS adjustments
renderer.setPixelRatio(window.devicePixelRatio);
const canvas = renderer.domElement;
canvas.id = 'canvas';
canvas.style.display = 'block'; // Removes padding below canvas
document.body.style.margin = 0; // Removes margin around page
document.body.style.overflow = 'hidden'; // Fix scrolling

// menu scene
menuRenderer.setPixelRatio(window.devicePixelRatio);
const menuCanvas = menuRenderer.domElement;
menuCanvas.id = 'menuCanvas';
menuCanvas.style.display = 'block'; // Removes padding below canvas


// Set up controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 4;
controls.maxDistance = 16;
controls.update();

// Render loop
const onAnimationFrameHandler = (timeStamp) => {


    // ***DEBUGGING***
    // let plane = scene.getObjectByName(character);
    // plane.visible = false;
    // let chunkManager = scene.getObjectByName('chunkManager');
    // chunkManager.position.set(0, 0, 0);



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
        chunkManager.state.falling = 0;
        chunkManager.state.climbing = 0;

        score_num = 0;
    }
    // controls.update();
    window.requestAnimationFrame(onAnimationFrameHandler);
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

        if (frameCounter - lastTerrainUpdate > 500) {
            chunkManager.updateBiome(biomes[Math.floor(Math.random() * biomes.length)]);
            lastTerrainUpdate = frameCounter;
        }

        if (!screens["menu"] && !screens["ending"] && !screens["pause"]) {
            score_num += 0.01;
            score = score_num.toFixed(2);
            handlers.updateScore(document, score)
        }
        // console.log(score)

        // let land = scene.getObjectByName('land');
        // let boxHelper = new THREE.BoxHelper( land, 0xffffff );
        // scene.add(boxHelper);

        // let plane = scene.getObjectByName('paper');
        // let boxHelper2 = new THREE.BoxHelper( plane, 0xffffff );
        // scene.add(boxHelper2);
        // console.log(scene.getObjectByName('falcon').position.y-sealevel)

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

// Listen for user input (arrow keys)
/**************************EVENT LISTENERS*****************************/
window.addEventListener('keydown', event => handlers.handleKeyDown(event, keypress), false);
window.addEventListener('keyup', event => handlers.handleKeyUp(event, keypress), false);
window.addEventListener('keydown', event => handlers.handleScreens(event, screens, document, canvas, character, scene, menuCanvas, sounds, score));

/**********************************************************************/
let titleFont = document.createElement('link');
titleFont.id = 'titleFont'
titleFont.rel = "stylesheet";
titleFont.href = "https://fonts.googleapis.com/css?family=Audiowide";
document.head.appendChild(titleFont)

let font = document.createElement('link');
font.id = 'font'
font.rel = "stylesheet";
font.href = "https://fonts.googleapis.com/css?family=Radio+Canada";
document.head.appendChild(font)


// document.body.appendChild(canvas);
pages.init_page(document, menuCanvas);
