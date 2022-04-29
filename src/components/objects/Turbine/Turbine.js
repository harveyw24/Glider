import { Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three'
import MODEL from './scene.gltf';

class Turbine extends Group {
    constructor(parent) {
        // Call parent Group() constructor
        super();

        const loader = new GLTFLoader();

        this.name = 'turbine';
        this.state = {
            parent: parent,
        };

        // Add update list
        parent.state.parent.state.parent.addToUpdateList(this);

        loader.load(MODEL, (gltf) => {
            const scale = 10;
            gltf.scene.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2)
            gltf.scene.rotateOnAxis(new THREE.Vector3(0, 0, 1), Math.PI / 2)
            gltf.scene.scale.multiplyScalar(scale);
            this.box = new THREE.Box3().setFromObject(gltf.scene);

            this.add(gltf.scene);
        });
    }

    update(timeStamp) {
        // this.rotation.y += 0.01

    }
}

export default Turbine;
