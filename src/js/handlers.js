import * as THREE from "three";
import * as pages from "./pages.js"
import * as utils from "./utils.js"

function clamp (val,min,max) {
    return Math.max(min,Math.min(max,val));
}

export function handleKeyDown(event, keypress) {
    if (event.key == "ArrowUp") keypress['up'] = true;
    if (event.key == "ArrowDown") keypress['down'] = true;
    if (event.key == "ArrowLeft") keypress['left'] = true;
    if (event.key == "ArrowRight") keypress['right'] = true;
}

export function handleKeyUp(event, keypress) {
    if (event.key == "ArrowUp") keypress['up'] = false;
    if (event.key == "ArrowDown") keypress['down'] = false;
    if (event.key == "ArrowLeft") keypress['left'] = false;
    if (event.key == "ArrowRight") keypress['right'] = false;
}

export function handleCharacterControls(scene, keypress, character, camera) {
    let obj = scene.getObjectByName(character);
    if (keypress['up'] && obj.position.y < 2) {
        obj.position.y += 0.1;
        obj.box.min.y += 0.1;
        obj.box.max.y += 0.1;
    }
    if (keypress['down'] && obj.position.y > -2) {
        obj.position.y -= 0.1;
        obj.box.min.y -= 0.1;
        obj.box.max.y -= 0.1;
    }
    if (keypress['right'] && obj.position.x < 4) {
        obj.position.x += 0.1;
        obj.position.x += 0.1;
        obj.box.min.x += 0.1;
        // obj.rotation.z += 0.015;
        // need to somehow rotate bounding box
    }
    if (keypress['left'] && obj.position.x > -4) {
        obj.position.x -= 0.1;
        obj.position.x -= 0.1;
        obj.box.min.x -= 0.1;
        // obj.rotation.z -= 0.015;
        // need to somehow rotate bounding box
    }

    // clamp to viewport, not working
    // let h = visibleHeightAtZDepth(5, camera);
    // let w = visibleWidthAtZDepth(5, camera);
    
    // obj.position.y = clamp(obj.position.y, -h,h);
    // obj.position.x = clamp(obj.position.x, -w,w);



}
// Handle screens
export function handleScreens(event, screens, document, canvas, sound, score) {
    // quit: game -> ending
    if (event.key == 'q') {
        screens['menu'] = false;
        screens['paused'] = false;
        screens['ending'] = true;
        pages.quit(document, score);
        sound.stop()
    }
    // restart: ending -> menu
    else if (event.key == " " && screens["ending"]) {
        screens["ending"] = false;
        screens['pause'] = false;
        screens['menu'] = true;
        pages.init_page(document)
    }
    // start: menu -> game
    else if (event.key == " " && screens["menu"]) {
        screens["menu"] = false;
        pages.start(document, canvas);
        sound.play()
    }
     // unpause: pause -> game
    else if (event.key == " " && screens["pause"]) {
        screens["pause"] = false;
        sound.setVolume(0.5);
    }
   // unpause: pause -> game
    else if (event.key == " " && !screens["ending"]) {
        screens["pause"] = true;
        sound.setVolume(0.2);
    }
}

// placeholder function for now to handle collisions. Needs to be generalizable to any obstacle. Needs to make the character do something instead of phase right through - for example, crash animation.
export function handleCollisions(scene, character){
    let land = scene.getObjectByName('land');
    let chunkManager = scene.getObjectByName('chunkManager');
    let obj = scene.getObjectByName(character);
    let meshes = [];
    let plane = [];
    utils.findType(land, 'Mesh', meshes)
    // utils.findType(chunkManager, 'Mesh', meshes)

    utils.findType(obj, 'Mesh', plane);
    let pos = plane[0].geometry.attributes.position;
    let norm = plane[0].geometry.attributes.normal;
    let matWorld = plane[0].matrixWorld;
    const vector_pos = new THREE.Vector3();
    const vector_norm = new THREE.Vector3();
    
    for (let i = 0; i < pos.count; i += 1) {
        vector_pos.fromBufferAttribute(pos, i);
        vector_pos.applyMatrix4(matWorld);
        vector_norm.fromBufferAttribute(norm, i);
        vector_norm.applyMatrix4(matWorld);
        let ray = new THREE.Raycaster(vector_pos, vector_norm);
        let collisions = ray.intersectObjects(meshes, false);
        collisions.forEach(collision => {
            if (collision.distance < 2) {
                chunkManager.position.y += 3;
                // obj.position = obj.position.add(vector_norm.multiplyScalar(1))
                // obj.position.x -= vector_norm.x * 0.1;
                // obj.position.y -= vector_norm.y * 0.1;

                // console.log('collision');
            }
        })
    }

}


export function updateScore(document, score) {
    let scoreCounter = document.getElementById('score');
    scoreCounter.innerHTML = 'Score: '.concat(score)
}




