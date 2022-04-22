import { Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three'
import MODEL from './scene.gltf';

class Paper extends Group {
    constructor() {
        // Call parent Group() constructor
        super();

        const loader = new GLTFLoader();

        this.name = 'paper';

        loader.load(MODEL, (gltf) => {
            gltf.scene.scale.multiplyScalar(5);
            // gltf.scene.position.x = 0; 
            // gltf.scene.position.y = 0;
            // gltf.scene.position.z = 0;
            const box = new THREE.Box3().setFromObject( gltf.scene );
            const center = box.getCenter( new THREE.Vector3() );

            gltf.scene.position.x += ( gltf.scene.position.x - center.x );
            gltf.scene.position.y += ( gltf.scene.position.y - center.y );
            gltf.scene.position.z += ( gltf.scene.position.z - center.z );
            this.add(gltf.scene);
            this.box = new THREE.Box3().setFromObject(gltf.scene);
        });
    }
}

export default Paper;