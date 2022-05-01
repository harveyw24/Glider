import * as THREE from 'three';
import { Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as utils from "../../../js/utils.js"

import MODEL from './scene.gltf';

class Sheep extends Group {
    constructor(parent) {
        // Call parent Group() constructor
        super();


        const loader = new GLTFLoader();

        this.name = 'sheep';
        loader.load(MODEL, (gltf) => {
            gltf.scene.scale.multiplyScalar(10);

            // const meshes = [];
            // utils.findType(gltf.scene, "Mesh", meshes);
            // meshes[0].material = new THREE.MeshLambertMaterial({ color: 0x2E6021 });

            const box = new THREE.Box3().setFromObject( gltf.scene, true);
            const center = box.getCenter( new THREE.Vector3() );

            gltf.scene.position.x += ( gltf.scene.position.x - center.x );
            gltf.scene.position.y += ( gltf.scene.position.y - center.y + 5 );
            gltf.scene.position.z += ( gltf.scene.position.z - center.z );

            this.add(gltf.scene);
        });
    }

}

export default Sheep;
