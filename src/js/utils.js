// inspired by https://stackoverflow.com/questions/56680582/how-can-i-get-the-geometry-from-a-gltf-object
export function findType(object, type, arr) {
    object.children.forEach((child) => {
        if (child.type === type) {
            arr.push(child)
        }
        findType(child, type, arr);
    });
}