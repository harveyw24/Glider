import * as THREE from "three";
import * as pages from "./pages.js"
import END from '../../ending.html'
import START from '../../start.html'

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
        obj.rotation.z += 0.015;
        // need to somehow rotate bounding box
    }
    if (keypress['left'] && obj.position.x > -4) {
        obj.position.x -= 0.1;
        obj.position.x -= 0.1;
        obj.box.min.x -= 0.1;
        obj.rotation.z -= 0.015;
        // need to somehow rotate bounding box
    }

    // clamp to viewport, not working
    // let h = visibleHeightAtZDepth(5, camera);
    // let w = visibleWidthAtZDepth(5, camera);
    
    // obj.position.y = clamp(obj.position.y, -h,h);
    // obj.position.x = clamp(obj.position.x, -w,w);



}

// Handle screens
export function handleScreens(event, screens, document, canvas, restart) {
    if (event.key == 'q') {
        screens['menu'] = false;
        screens['paused'] = false;
        screens['ending'] = true;
        pages.quit(document);
    }
    else if (event.key == " " && screens["ending"]) {
        screens["ending"] = false;
        screens['pause'] = false;
        screens['menu'] = true;
        restart.value = true;
        pages.init_page(document)
    }
    else if (event.key == " " && screens["menu"]) {
        screens["menu"] = false;
        pages.start(document, canvas, restart);
    }
    else if (event.key == " " && screens["pause"]) {
        screens["pause"] = false;
    }
    else if (event.key == " " && !screens["ending"]) {
        screens["pause"] = true;
    }
}

// placeholder function for now to handle collisions. Needs to be generalizable to any obstacle. Needs to make the character do something instead of phase right through - for example, crash animation.
export function handleCollisions(scene, character){
    let land = scene.getObjectByName('land');
    let obj = scene.getObjectByName(character);
    if (obj.box.intersectsBox(land.box)) {
        console.log("collision")
    }
}



