export function handleKeyPress(scene, camera, event) {
    const position = scene.getObjectByName("falcon").position;
    if (event.key == "ArrowUp") {
        scene.getObjectByName("falcon").position.set(position.x, position.y + 0.2, position.z);
    }
    if (event.key == "ArrowDown") {
        scene.getObjectByName("falcon").position.set(position.x, position.y - 0.2, position.z);
    }
    if (event.key == "ArrowLeft") {
        scene.getObjectByName("falcon").position.set(position.x - 0.2, position.y, position.z);
    }
    if (event.key == "ArrowRight") {
        scene.getObjectByName("falcon").position.set(position.x + 0.2,position.y,position.z);
    }
}