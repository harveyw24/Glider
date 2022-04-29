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
        const delta = 2 * Math.sqrt(speedLevel) * (Math.abs(plane.rotation.z) + 0.5);
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
        const delta = 2 * Math.sqrt(speedLevel) * (Math.abs(plane.rotation.z) + 0.5);
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
        screens['pause'] = false;
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
    let clouds = [];

    let obj = scene.getObjectByName(character);
    let chunkManagerPos = chunkManager.position;
    let chunkWidth = chunkManager.state.chunkWidth;
    let chunkLine = chunkManager.getCurrentChunkLine(); // TODO: change to current chunk
    let chunk = chunkManager.getCurrentChunk(); // TODO: change to current chunk
    let heightMap = chunk.heightMap;

    // console.log(chunkManagerPos);

    // let i = (-((chunkManagerPos.x + chunkLine.position.x) % chunkWidth) + chunkWidth / 2) / chunkWidth * (heightMap.length);
    // let j = Math.round((chunkWidth - (chunkManagerPos.z % chunkWidth)) / chunkWidth * (heightMap.length - 1));

    // const v1 = chunk.getVertexAtCoords(Math.floor(i), j);
    // const v2 = chunk.getVertexAtCoords(Math.ceil(i), j);

    // let vertexHeight = Math.min(v1.z, v2.z);
    // console.log("VERTEX HEIGHT: ", vertexHeight);

    // console.log(v1.z);
    let i = (chunkWidth - (chunkManagerPos.z - chunkManager.anchor.z)) / chunkWidth * (heightMap.length - 1);
    let j = (-((chunkManagerPos.x + chunkLine.position.x) % chunkWidth) + chunkWidth / 2) / chunkWidth * (heightMap.length - 1);

    // check square around current vPos
    const vPos1 = chunk.getPositionAtCoords(Math.floor(i), Math.floor(j));
    const vPos2 = chunk.getPositionAtCoords(Math.floor(i), Math.ceil(j));
    const vPos3 = chunk.getPositionAtCoords(Math.ceil(i), Math.floor(j));
    const vPos4 = chunk.getPositionAtCoords(Math.ceil(i), Math.ceil(j));

    // Collide with terrain (chunk)
    // target is how much the ground has risen, vPos is chunk height at cur point
    let target = new THREE.Vector3();
    chunk.getWorldPosition(target);

    // Debugging for terrain collisions
    // const targetWorldXY = new THREE.Vector2(vPos.x + target.x, vPos.z + target.z);
    // if (cumulNum == 100) {
    //     console.log("Average targetWorldXY: ", cumulXYError / cumulNum);
    //     cumulNum = cumulXYError = 0;
    // }
    // cumulXYError += targetWorldXY.length();
    // cumulNum++;
    // if (targetWorldXY.length() > 40) {
    //     console.log("current (i,j): ", [i, j], "current targetWorldXY: ", targetWorldXY, "chunkManagerPos.z: ", chunkManagerPos.z, "chunk.position.z: ", chunk.position.z);
    //     console.log("current chunkline:", chunkLine);
    //     console.log("TargetWorldXY is too far away!");
    //     screens['pause'] = true;
    // }

    // if (target.y + chunkManager.state.groundY - obj.position.y > -v1.z) {
    if (target.y - obj.position.y > - Math.min(vPos1.y, vPos2.y, vPos3.y, vPos4.y)) {
        // screens['menu'] = false;
        screens['pause'] = true;
        // screens['ending'] = true;
        // pages.quit(document, score);
        // sounds['whirring'].stop()
        // document.getElementById('audio').pause()
        // sounds['menu'].stop()
    }

    // console.log(target.y + chunkManager.state.groundY + vertexHeight);

    // if (target.y + chunkManager.state.groundY + vertexHeight > 2) {
    //     screens['menu'] = false;
    //     screens['paused'] = false;
    //     screens['ending'] = true;
    //     pages.quit(document, score);
    //     sounds['whirring'].stop()
    //     document.getElementById('audio').pause()
    //     // sounds['menu'].stop()
    // }


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
            timer = setTimeout(function() { buffer = false; console.log("UNBUFFERED!"); }, 3000);
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


