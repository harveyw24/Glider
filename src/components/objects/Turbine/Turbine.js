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
        // this.hitbox = null;
        this.state = {
            parent: parent,
        };

        // Add update list
        parent.state.parent.state.parent.addToUpdateList(this);

        loader.load(MODEL, (gltf) => {
            const scale = 12;
            gltf.scene.position.x = 0;
            gltf.scene.position.y = 0;
            gltf.scene.position.z = 0;
        
            gltf.scene.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2)
            gltf.scene.rotateOnAxis(new THREE.Vector3(0, 0, 1), Math.PI / 2)
            gltf.scene.position.add(new THREE.Vector3(.83, .65, -2).multiplyScalar(scale));
            gltf.scene.scale.multiplyScalar(scale);
            this.add(gltf.scene);
           
            this.box = new THREE.Box3().setFromObject(gltf.scene);

            // this.add(gltf.scene);
        });
    }

    update(timeStamp) {
        // this.rotation.y += 0.01


    }
}

export default Turbine;
