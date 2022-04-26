import * as THREE from 'three';
import { Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import MODEL from './scene.gltf'; // change to scene.gltf when tree is fixed

class Tree extends Group {
    constructor(parent) {
        // Call parent Group() constructor
        super();


        const loader = new GLTFLoader();

        this.name = 'tree';
        loader.load(MODEL, (gltf) => {
            gltf.scene.scale.multiplyScalar(0.5);
            this.box = new THREE.Box3().setFromObject(gltf.scene);
            this.add(gltf.scene);
        });
    }

}

export default Tree;
