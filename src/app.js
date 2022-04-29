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
import *  as handlers from './js/handlers.js';
import * as pages from "./js/pages.js";
import './styles.css';
import * as THREE from 'three';
import { apply } from 'file-loader';


function initSky(sky, sun, renderer, gui) {
    /// GUI

    const effectController = {
        turbidity: 10,
        rayleigh: 3,
        mieCoefficient: 0.005,
        mieDirectionalG: 0.7,
        elevation: 2,
        azimuth: 180,
        exposure: renderer.toneMappingExposure
    };

    function guiChanged() {

        const uniforms = sky.material.uniforms;
        uniforms['turbidity'].value = effectController.turbidity;
        uniforms['rayleigh'].value = effectController.rayleigh;
        uniforms['mieCoefficient'].value = effectController.mieCoefficient;
        uniforms['mieDirectionalG'].value = effectController.mieDirectionalG;

        const phi = THREE.MathUtils.degToRad(90 - effectController.elevation);
        const theta = THREE.MathUtils.degToRad(effectController.azimuth);

        sun.setFromSphericalCoords(1, phi, theta);

        uniforms['sunPosition'].value.copy(sun);

        renderer.toneMappingExposure = effectController.exposure;
        renderer.render(scene, camera);

    }

    gui.add(effectController, 'turbidity', 0.0, 20.0, 0.1).onChange(guiChanged);
    gui.add(effectController, 'rayleigh', 0.0, 4, 0.001).onChange(guiChanged);
    gui.add(effectController, 'mieCoefficient', 0.0, 0.1, 0.001).onChange(guiChanged);
    gui.add(effectController, 'mieDirectionalG', 0.0, 1, 0.001).onChange(guiChanged);
    gui.add(effectController, 'elevation', 0, 90, 0.1).onChange(guiChanged);
    gui.add(effectController, 'azimuth', - 180, 180, 0.1).onChange(guiChanged);
    gui.add(effectController, 'exposure', 0, 1, 0.0001).onChange(guiChanged);

    guiChanged();
}
//
const default_biome = {
    waterColor: new THREE.Color(50, 90, 145),
    bankColor: new THREE.Color(26, 143, 26),
    middleColor: new THREE.Color(113, 105, 105),
    peakColor: new THREE.Color(255, 255, 255),
    exaggeration: 17
}
const desert_biome = {
    waterColor: new THREE.Color(97, 32, 13),
    bankColor: new THREE.Color(97, 32, 13),
    middleColor: new THREE.Color(232, 161, 90),
    peakColor: new THREE.Color(252, 203, 78),
    exaggeration: 10
}

const volcano_biome = {
    waterColor: new THREE.Color(0, 0, 0),
    bankColor: new THREE.Color(0, 0, 0),
    middleColor: new THREE.Color(0, 0, 0),
    peakColor: new THREE.Color(242, 64, 24),
    exaggeration: 30
}

const biomes = [default_biome, desert_biome, volcano_biome];


// Initialize core ThreeJS components
let scene = new SeedScene();
const camera = new PerspectiveCamera();
const renderer = new WebGLRenderer({ antialias: true });
const listener = new THREE.AudioListener();

let menuScene = new MenuScene();
const menuCamera = new PerspectiveCamera();
const menuRenderer = new WebGLRenderer({ antialias: true });


camera.add(listener);
const sounds = [];
const menu = new THREE.Audio(listener);
const whirring = new THREE.Audio(listener);
const damage = new THREE.Audio(listener);
const powerup = new THREE.Audio(listener);
//  sounds['menu'] = menu;
sounds['whirring'] = whirring;
sounds['damage'] = damage;
sounds['powerup'] = powerup;


const clock = new THREE.Clock();
const terrainClock = new THREE.Clock();
let speedLevel = 1;

initSky(scene.sky, scene.sun, renderer, scene.state.gui);
initSky(menuScene.sky, scene.sun, menuRenderer, menuScene.state.gui)
const audioLoader = new THREE.AudioLoader();
audioLoader.load('src/sounds/menu.wav', function(buffer) {
    menu.setBuffer(buffer);
    menu.setLoop(true);
    menu.setVolume(1);
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

clock.start()
terrainClock.start()

// Render loop
const onAnimationFrameHandler = (timeStamp) => {
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
        let chunkManager = scene.getObjectByName('chunkManager');
        chunkManager.update(timeStamp, speedLevel);

        renderer.render(scene, camera);
        scene.update && scene.update(timeStamp);

        handlers.handleCollisions(document, scene, character, screens, sounds, score, camera); // needs to happen immediately after update for accuracy
        handlers.handleCharacterControls(scene, keypress, character, camera, speedLevel);
        handlers.updateAudioSpeed(document, sounds, scene);

        let elapsed = clock.getElapsedTime();
        if (elapsed - oldTime > 5 && speedLevel < 2) {
            speedLevel *= 1.1;
            oldTime = elapsed;
        }

        let terrainElapsed = terrainClock.getElapsedTime();
        if (terrainElapsed - terrainOldTime > 10) {
            let biome = biomes[Math.floor(Math.random() * biomes.length)]
            chunkManager.state.bankColor = biome.bankColor;
            chunkManager.state.waterColor = biome.waterColor;
            chunkManager.state.middleColor = biome.middleColor;
            chunkManager.state.peakColor = biome.peakColor;
            chunkManager.state.exaggeration = biome.exaggeration;
            terrainOldTime = terrainElapsed;
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
window.addEventListener('keydown', event => handlers.handleScreens(event, screens, document, canvas, menuCanvas, sounds, score));

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


pages.init_page(document, menuCanvas);



