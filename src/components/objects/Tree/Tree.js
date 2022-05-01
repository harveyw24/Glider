import * as THREE from 'three';
import { Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as utils from "../../../js/utils.js"

import MODEL from './scene.gltf'; // change to scene.gltf when tree is fixed

class Tree extends Group {
    constructor(parent) {
        // Call parent Group() constructor
        super();


        const loader = new GLTFLoader();

        this.name = 'tree';
        loader.load(MODEL, (gltf) => {
            const scale = .05;
            const meshes = [];
            utils.findType(gltf.scene, "Mesh", meshes);
            meshes[0].geometry.translate(-463, -170, -30);
            meshes[0].geometry.scale(scale, scale, scale);
            meshes[0].material = new THREE.MeshLambertMaterial({ color: 0x42692f });
            this.box = new THREE.Box3().setFromObject(gltf.scene);
            this.add(gltf.scene);
        });
    }

}

export default Tree;
