// this function results in uneven movement since holding down a key is equivalent to rapidly firing the keypress. However, you have to hold the key down for quite some time before the keypress events are evenly spaced. Deprecated
// export function handleKeyPress(scene, name, event) {
//     let obj = scene.getObjectByName(name);
//     let position = obj.position;
//     if (event.key == "ArrowUp") {
//        obj.position.set(position.x,position.y+0.2,position.z)
//     }
//     if (event.key == "ArrowDown") {
//         obj.position.set(position.x,position.y-0.2,position.z)
//     }
//     if (event.key == "ArrowLeft") {
//         obj.position.set(position.x - 0.2,position.y,position.z)
//     }
//     if (event.key == "ArrowRight") {
//         obj.position.set(position.x + 0.2,position.y,position.z)
//     }
// }

import * as THREE from "three";

function clamp (val,min,max) {
    return Math.max(min,Math.min(max,val));
}

// https://discourse.threejs.org/t/functions-to-calculate-the-visible-width-height-at-a-given-z-depth-from-a-perspective-camera/269
// const visibleHeightAtZDepth = ( depth, camera ) => {
//     // compensate for cameras not positioned at z=0
//     const cameraOffset = camera.position.z;
//     if ( depth < cameraOffset ) depth -= cameraOffset;
//     else depth += cameraOffset;
  
//     // vertical fov in radians
//     const vFOV = camera.fov * Math.PI / 180; 
  
//     // Math.abs to ensure the result is always positive
//     return 2 * Math.tan( vFOV / 2 ) * Math.abs( depth );
//   };
  
//   const visibleWidthAtZDepth = ( depth, camera ) => {
//     const height = visibleHeightAtZDepth( depth, camera );
//     return height * camera.aspect;
//   };

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
    if (keypress['up']) obj.position.y += 0.1;
    if (keypress['down']) obj.position.y -= 0.1;
    if (keypress['right']) obj.position.x += 0.1;
    if (keypress['left']) obj.position.x -= 0.1;

    // clamp to viewport, not working
    // let h = visibleHeightAtZDepth(5, camera);
    // let w = visibleWidthAtZDepth(5, camera);
    
    // obj.position.y = clamp(obj.position.y, -h,h);
    // obj.position.x = clamp(obj.position.x, -w,w);


}