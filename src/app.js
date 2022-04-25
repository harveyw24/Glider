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
import  *  as handlers from './components/js/handlers.js';
import * as pages from "./components/js/pages.js";
import './styles.css';
import * as THREE from 'three';
import { apply } from 'file-loader';



// Initialize core ThreeJS components
let scene = new SeedScene();
const camera = new PerspectiveCamera();
const renderer = new WebGLRenderer({ antialias: true });

// Initialize global variables
const keypress = {};
const screens = {"menu": true, "ending": false, "pause":false};
const character = 'paper';
const restart = {value: false};

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

// Render loop
const onAnimationFrameHandler = (timeStamp) => {
    if (restart.value) {
        restart.value = false;
        scene = new SeedScene();
    }
    // controls.update();
    window.requestAnimationFrame(onAnimationFrameHandler);
    if (!screens["menu"] && !screens["ending"] && !screens["pause"]) {
        renderer.render(scene, camera);
        scene.update && scene.update(timeStamp);
        handlers.handleCharacterControls(scene, keypress, character, camera);
        // handlers.handleCollisions(scene, character);

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
window.addEventListener('keydown', event => handlers.handleScreens(event, screens, document, canvas, restart));

/**********************************************************************/

pages.init_page(document);