import * as THREE from "three";
import * as pages from "./pages.js"
import * as utils from "./utils.js"

let buffer = false;

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
    if (keypress['up'] && obj.position.y < 5) {
        obj.position.y += 0.1;
        obj.box.min.y += 0.1;
        obj.box.max.y += 0.1;
    }
    if (keypress['down'] && obj.position.y > -5) {
        obj.position.y -= 0.1;
        obj.box.min.y -= 0.1;
        obj.box.max.y -= 0.1;
    }
    if (keypress['right'] && obj.position.x < 10) {
        obj.position.x += 0.1;
        obj.position.x += 0.1;
        obj.box.min.x += 0.1;
        // obj.rotation.z += 0.015;
        // need to somehow rotate bounding box
    }
    if (keypress['left'] && obj.position.x > -10) {
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

    // let land = scene.getObjectByName('land');
export function handleCollisions(scene, character, screens, sound, score){
    if (buffer) return;

    let land = scene.getObjectByName('land');
    let chunkManager = scene.getObjectByName('chunkManager');
    let clouds = [];
    scene.traverseVisible(function(child) {
        if (child.name === "cloud") {
            let matWorld = child.matrixWorld;
            // let vector_pos = new THREE.Vector3(0,0,0);
            // vector_pos.copy(child.position);
            // vector_pos.applyMatrix4(matWorld);
            // console.log(vector_pos)
            let vector_pos = new THREE.Vector3();
            child.getWorldPosition(vector_pos);

            if (vector_pos.z > -100 && vector_pos.z < 100 && vector_pos.x > -50 && vector_pos.x < 50) {
                clouds.push(child); 
                child.mesh.material.color.setHex(0xff0000)
                // console.log(child.position.x)
                // console.log(child.position.y)
                // console.log(child.position.z)

                // console.log(vector_pos.x);
                // console.log(vector_pos.y);
                // console.log(vector_pos.z);
            }
            else {
                child.mesh.material.color.setHex(0xffffff)

            }
          
        }
      });

    let obj = scene.getObjectByName(character);
    let meshes = [];
    let plane = [];
    // utils.findType(land, 'Mesh', meshes)
    clouds.forEach(cloud => {
        utils.findType(cloud, 'Mesh', meshes)
    })
    // utils.findType(chunkManager, 'Mesh', meshes)
    utils.findType(obj, 'Mesh', plane);
    let pos = plane[0].geometry.attributes.position;
    let norm = plane[0].geometry.attributes.normal;
    let matWorld = plane[0].matrixWorld;
    const vector_pos = new THREE.Vector3();
    const vector_norm = new THREE.Vector3();

    let raytip = new THREE.Raycaster(plane[0].tip, new THREE.Vector3(0,0,-1));
    let raycollisions = raytip.intersectObjects(meshes, false);
        if (raycollisions.length != 0 && raycollisions[0].distance < 0.5) {
            buffer = true;
            // chunkManager.position.y += 30;
            let fillScreen = document.getElementById('fillScreen');
            fillScreen.classList.add('red');
            setTimeout(function() {
                fillScreen.classList.remove('red');
            }, 500);
            // obj.position = obj.position.add(vector_norm.multiplyScalar(1))
            // obj.position.x -= vector_norm.x * 0.1;
            // obj.position.y -= vector_norm.y * 0.1;

            // console.log('collision');
            setTimeout (function(){ buffer = false}, 5000);
            return;
        }

    
    for (let i = 0; i < pos.count; i += 1) {
        vector_pos.fromBufferAttribute(pos, i);
        vector_pos.add(obj.position)
        vector_pos.z -= 12;
        vector_pos.y -= 2.5;
        // vector_pos.applyMatrix4(matWorld);
        vector_norm.fromBufferAttribute(norm, i);
        // vector_norm.applyMatrix4(matWorld);
        let ray = new THREE.Raycaster(vector_pos, vector_norm);
        // scene.add(new THREE.ArrowHelper(ray.ray.direction, ray.ray.origin, 0.5, 0xff0000) );

        let collisions = ray.intersectObjects(meshes, false);
        if (collisions.length != 0 && collisions[0].distance < 0.5) {
            obj.state.hit = true;
            buffer = true;
            // console.log(obj.state)
            // chunkManager.position.y += 30;
            let fillScreen = document.getElementById('fillScreen');
            fillScreen.classList.add('red');
            setTimeout(function() {
                fillScreen.classList.remove('red');
            }, 500);
            setTimeout (function(){ buffer = false}, 5000)
            // obj.state.hit = false;
            break;
        }
    
    }

    let chunkManagerPos = chunkManager.position;
    let chunkWidth = chunkManager.state.chunkWidth;
    let terrain = chunkManager.chunks[0].terrain;
    let heightMap = terrain.heightMap;
    
    // let j = Math.floor((chunkManagerPos.x + chunkWidth/2 + obj.position.x + 2 * Math.sign(obj.position.x)) / chunkWidth * (heightMap.length));
    let j = Math.floor((chunkManagerPos.x + chunkWidth/2) / chunkWidth * (heightMap.length));
    let i = Math.round((chunkWidth - (chunkManagerPos.z % chunkWidth)) / chunkWidth * (heightMap.length - 1));

    const index = (i * (heightMap.length) + j);
    const v1 = terrain.geometry.vertices[index];

    // DEBUG LOGGING
    // console.log("--------------");
    // console.log(chunkManagerPos.z);
    // console.log("i", i);
    // console.log(v1);
    // terrain.clouds[0].position.set(v1.x, 0, -v1.y);
    // console.log("HEIGHT: ", v1.z);

    // Collide with terrain
    // target is how much the ground has risen, -v1.z is terrain height at cur point
    let target = new THREE.Vector3();
    terrain.getWorldPosition(target);
    if (target.y + chunkManager.state.groundY - obj.position.y > -v1.z) {
        screens['menu'] = false;
        screens['paused'] = false;
        screens['ending'] = true;
        pages.quit(document, score);
        sound.stop()
    }
}


export function updateScore(document, score) {
    let scoreCounter = document.getElementById('score');
    scoreCounter.innerHTML = 'Score: '.concat(score)
}




