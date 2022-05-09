import { Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three'
import MODEL from './scene.gltf';

const scale = 15;
export const radius = .75 * scale;

class Turbine extends Group {
    constructor(init = false) {
        // Call parent Group() constructor
        super();
        this.name = 'turbine';

        const loader = new GLTFLoader();
        loader.load(MODEL, (gltf) => {
            gltf.scene.position.x = 0;
            gltf.scene.position.y = 0;
            gltf.scene.position.z = 0;

            gltf.scene.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2)
            gltf.scene.rotateOnAxis(new THREE.Vector3(0, 0, 1), Math.PI / 2)
            gltf.scene.position.add(new THREE.Vector3(.83, .65, -2).multiplyScalar(scale));
            gltf.scene.scale.multiplyScalar(scale);
            this.add(gltf.scene);
        });

        if (init) this.newHitbox();
    }

    newHitbox() {

        // hitbox visualization
        const geo = new THREE.SphereGeometry(radius, 6, 6);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            opacity: 0.2,
            transparent: true,
        });
        const mesh = new THREE.Mesh(geo, material);
        this.add(mesh);
    }

    update(timeStamp) {
        this.rotation.y += 0.01
    }
}

export default Turbine;
