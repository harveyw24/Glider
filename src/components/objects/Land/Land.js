import { Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three'
import MODEL from './land.gltf';

class Land extends Group {
  constructor() {
    // Call parent Group() constructor
    super();

    const loader = new GLTFLoader();

    this.name = 'land';

    loader.load(MODEL, (gltf) => {
      this.add(gltf.scene);
      this.box = new THREE.Box3().setFromObject(gltf.scene, true);
    });
  }
}

export default Land;
