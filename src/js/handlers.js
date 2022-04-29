import * as THREE from "three";
import * as pages from "./pages.js"
import * as utils from "./utils.js"

let buffer = false;
let mute = false;

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
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
    let plane = scene.getObjectByName(character);
    let chunkManager = scene.getObjectByName('chunkManager');
    const maxRotation = 0.45;
    const maxPitch = 0.2;
    const rotationRate = 0.02;

    if (keypress['up'] && plane.position.y < 20) {
        const delta = 0.2;
        chunkManager.position.y -= delta;
        if (plane.rotation.x < maxPitch) {
            if (plane.rotation.x > maxPitch - 0.02) {
                plane.rotation.x += rotationRate / 4;
            } else {
                plane.rotation.x += rotationRate;
            }
        }
    }
    if (keypress['down']) {
        const delta = 0.4;
        chunkManager.position.y += delta;

        if (plane.rotation.x > -maxPitch) {
            if (plane.rotation.x < -maxPitch + 0.02) {
                plane.rotation.x -= rotationRate / 4;
            } else {
                plane.rotation.x -= rotationRate;
            }
        }
    }
    if (keypress['right']) {
        const delta = 2;
        chunkManager.position.x -= delta;
        // plane.state.rotation = "right";
        if (plane.rotation.z > -maxRotation) {
            if (plane.rotation.z < -maxRotation + 0.02) {
                plane.rotation.z -= rotationRate / 4;
            } else {
                plane.rotation.z -= rotationRate;
            }
        }
        // need to somehow rotate bounding box
    }
    if (keypress['left']) {
        const delta = 2;
        chunkManager.position.x += delta;
        // plane.state.rotation = "left";
        if (plane.rotation.z < maxRotation) {
            if (plane.rotation.z > maxRotation - 0.02) {
                plane.rotation.z += rotationRate / 4;
            } else {
                plane.rotation.z += rotationRate;
            }
        }

        // need to somehow rotate bounding box
    }
    camera.rotation.z = plane.rotation.z / 3;
    camera.position.y = 2 + plane.rotation.x * 2;

    // clamp to viewport, not working
    // let h = visibleHeightAtZDepth(5, camera);
    // let w = visibleWidthAtZDepth(5, camera);

    // obj.position.y = clamp(obj.position.y, -h,h);
    // obj.position.x = clamp(obj.position.x, -w,w);



}
// Handle screens
export function handleScreens(event, screens, document, canvas, menuCanvas, sounds, score) {
    if (event.key == 'm') {
        mute = !mute;
        if (!mute && !screens['ending'] && !screens['menu']) {
            document.getElementById('audio').play();
            sounds['whirring'].play();
        }
        else {
            document.getElementById('audio').pause();
            sounds['whirring'].stop();
        }
    }
    // quit: game -> ending
    if (event.key == 'q' && !screens['ending'] && !screens['menu']) {
        screens['menu'] = false;
        screens['paused'] = false;
        screens['ending'] = true;
        pages.quit(document, score);
        sounds['whirring'].stop()
        document.getElementById('audio').pause();

    }
    // restart: ending -> menu
    else if (event.key == " " && screens["ending"]) {
        screens["ending"] = false;
        screens['pause'] = false;
        screens['menu'] = true;
        pages.init_page(document, menuCanvas)
    }
    // start: menu -> game
    else if (event.key == " " && screens["menu"]) {
        screens["menu"] = false;
        pages.start(document, canvas);

        if (!mute) {
            sounds['whirring'].play()
            document.getElementById('audio').play()
        }
    }
    // unpause: pause -> game
    else if (event.key == " " && screens["pause"]) {
        screens["pause"] = false;
        sounds['whirring'].setVolume(0.4);
        document.getElementById('audio').volume = 1;
        let pause = document.getElementById("pause");
        pause.classList.add('invisible');
    }
    // pause: game -> pause
    else if (event.key == " " && !screens["ending"]) {
        screens["pause"] = true;
        sounds['whirring'].setVolume(0.1);
        document.getElementById('audio').volume = 0.5;
        
        let pause = document.getElementById("pause");
        pause.classList.remove('invisible');


    }
}

export function handleCollisions(document, scene, character, screens, sounds, score) {
    let chunkManager = scene.getObjectByName('chunkManager');
    let clouds = [];
    scene.traverseVisible(function(child) {
        if (child.name === "cloud") {
            let matWorld = child.matrixWorld;
            let vector_pos = new THREE.Vector3();
            child.getWorldPosition(vector_pos);

            if (vector_pos.z > -100 && vector_pos.z < 100 && vector_pos.x > -50 && vector_pos.x < 50) {
                clouds.push(child);
                child.mesh.material.color.setHex(0xff0000)
            }
            else {
                child.mesh.material.color.setHex(0xffffff)

            }

        }
    });

    let obj = scene.getObjectByName(character);
    let chunkManagerPos = chunkManager.position;
    let chunkWidth = chunkManager.state.chunkWidth;
    let chunkLine = chunkManager.getCurrentChunkLine(); // TODO: change to current chunk
    let chunk = chunkManager.getCurrentChunk(); // TODO: change to current chunk
    let heightMap = chunk.heightMap;

    let i = Math.floor((-((chunkManagerPos.x + chunkLine.position.x) % chunkWidth) + chunkWidth / 2) / chunkWidth * (heightMap.length));
    let j = Math.round((chunkWidth - (chunkManagerPos.z % chunkWidth)) / chunkWidth * (heightMap.length - 1));

    const v1 = chunk.getVertexAtCoords(i, j);
    // TODO: should probably check a square around v1


    // Collide with terrain (chunk)
    // target is how much the ground has risen, -v1.z is chunk height at cur point
    let target = new THREE.Vector3();
    chunk.getWorldPosition(target);
    if (target.y + chunkManager.state.groundY - obj.position.y > -v1.z) {
        screens['menu'] = false;
        screens['paused'] = false;
        screens['ending'] = true;
        pages.quit(document, score);
        sounds['whirring'].stop()
        document.getElementById('audio').pause()
        // sounds['menu'].stop()
    }


    const dummy = new THREE.Vector3();
    // console.log("to current reward", obj.position.distanceTo(chunkManager.getCurrentReward().getWorldPosition(dummy)));
    if (obj.position.distanceTo(chunkManager.getCurrentReward().getWorldPosition(dummy)) < 15) {
        if (!mute) sounds['powerup'].play();
        sounds['whirring'].setVolume(1)

        setTimeout(function() {
            sounds['whirring'].setVolume(0.4)
        }, 2000);

        // chunkManager.position.y -= 50;
        if (chunkManager.state.climbing == 0) {
            chunkManager.state.climbing = 1;
        }
    }


    if (!buffer) {
        let clouds = [];

        scene.traverseVisible(function(child) {
            if (child.name === "cloud") {
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

        let meshes = [];
        let plane = [];
        clouds.forEach(cloud => {
            utils.findType(cloud, 'Mesh', meshes)
        })
        // utils.findType(chunkManager, 'Mesh', meshes)
        utils.findType(obj, 'Mesh', plane);
        let pos = plane[0].geometry.attributes.position;
        let norm = plane[0].geometry.attributes.normal;
        const vector_pos = new THREE.Vector3();
        const vector_norm = new THREE.Vector3();

        let raytip = new THREE.Raycaster(plane[0].tip, new THREE.Vector3(0, 0, -1));
        let raycollisions = raytip.intersectObjects(meshes, false);
        if (raycollisions.length != 0 && raycollisions[0].distance < 0.5) {
            obj.state.hit = true;
            buffer = true;
            // console.log(obj.state)
            if (chunkManager.state.falling == 0) {
                chunkManager.state.falling = 1;
            }
            // chunkManager.position.y += 30;
            let fillScreen = document.getElementById('fillScreen');
            fillScreen.classList.add('red');
            setTimeout(function() {
                fillScreen.classList.remove('red');
            }, 500);
            if (!mute) sounds['damage'].play();
            // obj.position = obj.position.add(vector_norm.multiplyScalar(1))
            // obj.position.x -= vector_norm.x * 0.1;
            // obj.position.y -= vector_norm.y * 0.1;

            // console.log('collision');
            setTimeout(function() { buffer = false; console.log("UNBUFFERED!"); }, 3000)
            console.log("collision! (v0");
            return;
        }

        for (let i = 0; i < pos.count; i += 1) {
            vector_pos.fromBufferAttribute(pos, i);
            vector_pos.add(obj.position)
            vector_pos.z -= 12;
            vector_pos.y -= 2.5;
            // vector_pos.applyMatrix4(matWorld);
            vector_norm.fromBufferAttribute(norm, i);

            vector_pos.add(obj.position);
            let ray = new THREE.Raycaster(vector_pos, vector_norm);
            // scene.add(new THREE.ArrowHelper(ray.ray.direction, ray.ray.origin, 0.5, 0xff0000) );

            let collisions = ray.intersectObjects(meshes, false);
            if (collisions.length != 0 && collisions[0].distance < 0.5) {
                obj.state.hit = true;
                buffer = true;
                // console.log(obj.state)
                if (chunkManager.state.falling == 0) {
                    chunkManager.state.falling = 1;
                }
                // chunkManager.position.y += 30;
                let fillScreen = document.getElementById('fillScreen');
                fillScreen.classList.add('red');
                setTimeout(function() {
                    fillScreen.classList.remove('red');
                }, 500);
                if (!mute) sounds['damage'].play();

                setTimeout(function() { buffer = false; console.log("UNBUFFERED!"); }, 3000)
                // obj.state.hit = false;
                console.log("collision! (v1)");
                break;
            }

        }
    }
}


export function updateScore(document, score) {
    let scoreCounter = document.getElementById('score');
    scoreCounter.innerHTML = 'Score: '.concat(score);
}

export function updateAudioSpeed(document, sounds, scene) {
    let chunkManager = scene.getObjectByName('chunkManager');
    let height = chunkManager.getWorldPosition(new THREE.Vector3()).y;
    let newPlaybackSpeed = height / 400 + 1;
    let newPitch = -(newPlaybackSpeed - 1) * 1200;
    let audio = document.getElementById('audio');
    audio.playbackRate = newPlaybackSpeed;


}


