import * as THREE from 'three';
import { Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as utils from "../../../js/utils.js"

import MODEL from './scene.gltf';

class Penguin extends Group {
    constructor(parent) {
        // Call parent Group() constructor
        super();

        const loader = new GLTFLoader();

        this.name = 'penguin';
        loader.load(MODEL, (gltf) => {
            gltf.scene.scale.multiplyScalar(2.5);

            const meshes = [];
            utils.findType(gltf.scene, "SkinnedMesh", meshes);
            meshes[0].material = new THREE.MeshLambertMaterial({ color: 0x080808 });
            meshes[1].material = new THREE.MeshLambertMaterial({ color: 0xBDBDBD });
            meshes[2].material = new THREE.MeshLambertMaterial({ color: 0xCC5705 });

            const box = new THREE.Box3().setFromObject( gltf.scene, true);
            const center = box.getCenter( new THREE.Vector3() );

            gltf.scene.position.x += ( gltf.scene.position.x - center.x );
            gltf.scene.position.y += ( gltf.scene.position.y - center.y );
            gltf.scene.position.z += ( gltf.scene.position.z - center.z );

            this.add(gltf.scene);
        });
    }

}

export default Penguin;
