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
import { SeedScene } from 'scenes';
import  *  as handlers from './js/handlers.js';
import * as pages from "./js/pages.js";
import './styles.css';
import * as THREE from 'three';
import { apply } from 'file-loader';



// Initialize core ThreeJS components
let scene = new SeedScene();
const camera = new PerspectiveCamera();
const renderer = new WebGLRenderer({ antialias: true });
const listener = new THREE.AudioListener();
camera.add( listener );
const sound = new THREE.Audio( listener );
const clock = new THREE.Clock();

const audioLoader = new THREE.AudioLoader();
audioLoader.load( 'src/sounds/menu.wav', function( buffer ) {
	sound.setBuffer( buffer );
	sound.setLoop( true );
	sound.setVolume( 0.5 );
});

// Initialize global variables
const keypress = {};
const screens = {"menu": true, "ending": false, "pause":false};
const character = 'paper';
let score;
let score_num = 0;
let oldTime = 0;

// Set up camera
camera.position.set(0, 2, 8);
camera.lookAt(new Vector3(0, 0, 0));

// Set up renderer, canvas, and minor CSS adjustments
renderer.setPixelRatio(window.devicePixelRatio);
const canvas = renderer.domElement;
canvas.id = 'canvas';
canvas.style.display = 'block'; // Removes padding below canvas
document.body.style.margin = 0; // Removes margin around page
document.body.style.overflow = 'hidden'; // Fix scrolling

// Set up controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 4;
controls.maxDistance = 16;
controls.update();

clock.start()

// Render loop
const onAnimationFrameHandler = (timeStamp) => {
    if (screens['menu']) {
        let plane = scene.getObjectByName(character);
        let chunkManager = scene.getObjectByName('chunkManager');
        plane.position.x = 0;
        plane.position.y = 0;
        plane.position.z = 0;

        chunkManager.position.x = 0;
        chunkManager.position.y = 0;
        chunkManager.position.z = 10;

        score_num = 0;
    }
    // controls.update();
    window.requestAnimationFrame(onAnimationFrameHandler);
    if (!screens["menu"] && !screens["ending"] && !screens["pause"]) {
        renderer.render(scene, camera);
        scene.update && scene.update(timeStamp);
        handlers.handleCharacterControls(scene, keypress, character, camera);
        let elapsed = clock.getElapsedTime();
        if (elapsed - oldTime > 0.1) { 
            handlers.handleCollisions(scene, character);
            oldTime = elapsed;
        }
        score_num += 0.01;
        score = score_num.toFixed(2);
        handlers.updateScore(document, score)
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
};
windowResizeHandler();
window.addEventListener('resize', windowResizeHandler, false);

// Listen for user input (arrow keys)
/**************************EVENT LISTENERS*****************************/
window.addEventListener('keydown', event=> handlers.handleKeyDown(event, keypress), false);
window.addEventListener('keyup', event => handlers.handleKeyUp(event, keypress), false);
window.addEventListener('keydown', event => handlers.handleScreens(event, screens, document, canvas, sound, score));

/**********************************************************************/

pages.init_page(document);