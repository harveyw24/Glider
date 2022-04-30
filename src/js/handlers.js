import * as THREE from "three";
import * as pages from "./pages.js"
import * as utils from "./utils.js"

let buffer = false;
let mute = false;
let timer;

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

export function handleCharacterControls(scene, keypress, character, camera, speedLevel) {
    let plane = scene.getObjectByName(character);
    let chunkManager = scene.getObjectByName('chunkManager');
    const maxRotation = 0.5;
    const maxPitch = 0.2;
    const rotationRate = 0.02;

    if (keypress['up'] && plane.position.y < 20) {
        const delta = 0.2 * speedLevel;
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
        const delta = 0.4 * speedLevel;
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
        const delta = 2 * Math.sqrt(speedLevel) * (Math.min(0.5, Math.abs(plane.rotation.z)) + 0.5);
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
        const delta = 2 * Math.sqrt(speedLevel) * (Math.min(0.5, Math.abs(plane.rotation.z)) + 0.5);
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
    console.log(plane.rotation.x)
    console.log(plane.rotation.z)
    // if (!plane.state.barrel) {
    //     camera.rotation.z = plane.rotation.z / 3;
    // } 
    camera.rotation.z = plane.rotation.z / 3;
    camera.position.y = 2 + plane.rotation.x * 2;
    

    // clamp to viewport, not working
    // let h = visibleHeightAtZDepth(5, camera);
    // let w = visibleWidthAtZDepth(5, camera);

    // obj.position.y = clamp(obj.position.y, -h,h);
    // obj.position.x = clamp(obj.position.x, -w,w);



}
// Handle screens
export function handleScreens(event, screens, document, canvas, character, scene, menuCanvas, sounds, score) {
    if (event.key == 'm') {
        mute = !mute;
        if (!mute && !screens['ending'] && !screens['menu']) {
            document.getElementById('audio').play();
            sounds['whirring'].play();
        }
        else if (mute) {
            document.getElementById('audio').pause();
            sounds['whirring'].stop();
        }
    }
    // quit: game -> ending
    if (event.key == 'q' && !screens['ending'] && !screens['menu']) {
        screens['menu'] = false;
        screens['pause'] = false;
        screens['ending'] = true;
        pages.quit(document, score);
        sounds['whirring'].stop()
        document.getElementById('audio').pause();

    }
    // restart: ending -> menu
    else if (event.key == " " && screens["ending"]) {
        let plane = scene.getObjectByName(character);
        plane.null()
        screens["ending"] = false;
        screens['pause'] = false;
        screens['menu'] = true;
        pages.init_page(document, menuCanvas)
    }
    // start: menu -> game
    else if (event.key == " " && screens["menu"]) {
        screens["menu"] = false;
        pages.start(document, canvas);
        buffer = true;
        setTimeout(function() {
            buffer = false;
        }, 3000);
        clearTimeout(timer);

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

let cumulNum = 0;
let cumulXYError = 0;
export function handleCollisions(document, scene, character, screens, sounds, score, camera) {
    let chunkManager = scene.getObjectByName('chunkManager');

    let obj = scene.getObjectByName(character);
    let chunkManagerPos = chunkManager.position;
    let chunkWidth = chunkManager.state.chunkWidth;
    let chunkLine = chunkManager.getCurrentChunkLine(); // TODO: change to current chunk
    let chunk = chunkManager.getCurrentChunk(); // TODO: change to current chunk
    let heightMap = chunk.heightMap;


    let i = Math.floor((chunkWidth - (chunkManagerPos.z - chunkManager.anchor.z)) / chunkWidth * (heightMap.length - 1));
    let j = Math.floor((-(chunkManagerPos.x + chunkLine.position.x) + chunkWidth / 2) / chunkWidth * (heightMap.length - 1));
    // ensure that both (i,j) and (i+1,j+1) are valid coordinates
    if (i == heightMap.length - 1) { i--; console.log("!!!!!!!!!!!!! i at edge"); }
    if (j == heightMap.length - 1) { j--; console.log("!!!!!!!!!!!!! j at edge"); }

    // Collide with terrain (chunk)
    // chunkWorldPos is how much the ground has risen, vWorldPos is chunk height at cur point
    let chunkWorldPos = new THREE.Vector3();
    chunk.getWorldPosition(chunkWorldPos);

    // check square around current vWorldPos
    // vWorldPos1, vWorldPos2, vWorldPos3 form a triangle; vWorldPos2, vWorldPos3, vWorldPos4 form the other triangle
    const vWorldPos1 = chunk.getPositionAtCoords(i, j).add(chunkWorldPos);
    const vWorldPos2 = chunk.getPositionAtCoords(i, j + 1).add(chunkWorldPos);
    const vWorldPos3 = chunk.getPositionAtCoords(i + 1, j).add(chunkWorldPos);
    const vWorldPos4 = chunk.getPositionAtCoords(i + 1, j + 1).add(chunkWorldPos);



    let interp = new THREE.Vector3();
    const area2 = chunkManager.state.segmentWidth * chunkManager.state.segmentWidth;
    if (!(vWorldPos1.x <= 0 && vWorldPos4.x >= 0 && vWorldPos1.z <= 0 && vWorldPos4.z >= 0)) {
        console.log("Player not in square!");
        // screens["pause"] = true;
    } else {
        if (-vWorldPos2.z * (vWorldPos3.x - vWorldPos2.x) >= -vWorldPos2.x * (vWorldPos3.z - vWorldPos2.z)) {
            const baryCoord1 = (vWorldPos2.x * vWorldPos3.z - vWorldPos2.z * vWorldPos3.x) / area2;
            const baryCoord2 = (vWorldPos3.x * vWorldPos1.z - vWorldPos3.z * vWorldPos1.x) / area2;
            const baryCoord3 = (vWorldPos1.x * vWorldPos2.z - vWorldPos1.z * vWorldPos2.x) / area2;
            interp = vWorldPos1.multiplyScalar(baryCoord1).add(vWorldPos2.multiplyScalar(baryCoord2)).add(vWorldPos3.multiplyScalar(baryCoord3));
        } else {
            const baryCoord3 = (vWorldPos2.x * vWorldPos4.z - vWorldPos2.z * vWorldPos4.x) / area2;
            const baryCoord4 = (vWorldPos3.x * vWorldPos2.z - vWorldPos3.z * vWorldPos2.x) / area2;
            const baryCoord2 = (vWorldPos4.x * vWorldPos3.z - vWorldPos4.z * vWorldPos3.x) / area2;
            interp = vWorldPos2.multiplyScalar(baryCoord2).add(vWorldPos3.multiplyScalar(baryCoord3)).add(vWorldPos4.multiplyScalar(baryCoord4));
        }
    }



    if (interp.y > obj.position.y) {
        // screens['pause'] = true;
        console.log("Crash!");

        screens['menu'] = false;
        screens['pause'] = false;
        screens['ending'] = true;
        pages.quit(document, score);
        sounds['whirring'].stop()
        document.getElementById('audio').pause()
    }



    const rewardWorldPos = new THREE.Vector3();
    chunkManager.getCurrentReward().getWorldPosition(rewardWorldPos)
    // console.log(chunkManager.getCurrentReward().position.clone());
    // console.log("to current reward", obj.position.distanceTo(rewardWorldPos));

    // const geo = new THREE.SphereGeometry(5, 7, 8);
    // const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    // const mesh = new THREE.Mesh(geo, material);
    // mesh.position.set(rewardWorldPos.x - chunkManagerPos.x, rewardWorldPos.y - chunkManagerPos.y, rewardWorldPos.z - chunkManagerPos.z);
    // chunkManager.add(mesh);

    if (obj.position.distanceTo(rewardWorldPos) < 15) {
        obj.state.reward = true
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

        function collideCloud() {
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
            timer = setTimeout(function() { buffer = false; console.log("UNBUFFERED!"); }, 2500);
        }

        let raytip = new THREE.Raycaster(plane[0].tip, new THREE.Vector3(0, 0, -1));
        let raycollisions = raytip.intersectObjects(meshes, false);
        if (raycollisions.length != 0 && raycollisions[0].distance < 0.5) {
            collideCloud();
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
                collideCloud();
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
    let target = new THREE.Vector3();
    chunkManager.getWorldPosition(target);
    let height = target.y;
    let newPlaybackSpeed = height / 400 + 1;
    let newPitch = -(newPlaybackSpeed - 1) * 1200;
    let audio = document.getElementById('audio');
    audio.playbackRate = newPlaybackSpeed;
}


