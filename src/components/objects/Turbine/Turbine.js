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
            mixer: null,
            prevTimeStamp: null,
            parent: parent,
            animation: null,
            action: null,
        };

        // Add update list
        parent.state.parent.state.parent.addToUpdateList(this);

        loader.load(MODEL, (gltf) => {
            const scale = 7;
            gltf.scene.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2)
            gltf.scene.rotateOnAxis(new THREE.Vector3(0, 0, 1), Math.PI / 2)
            gltf.scene.scale.multiplyScalar(scale);
            this.box = new THREE.Box3().setFromObject(gltf.scene);

            // add mixer to state
            this.state.mixer = new THREE.AnimationMixer(gltf.scene);

            const clip = gltf.animations[0]
            this.state.action = this.state.mixer.clipAction(clip)
            this.state.action.play();

            this.add(gltf.scene);
        });
    }

    update(timeStamp) {
        if (this.state.prevTimeStamp === null) {
            this.state.prevTimeStamp = timeStamp;
        }

        let delta = (timeStamp - this.state.prevTimeStamp) / 400;

        // update previous time stamp
        this.state.prevTimeStamp = timeStamp;

        // update animation
        this.state.mixer.update(delta);
    }
}

export default Turbine;
