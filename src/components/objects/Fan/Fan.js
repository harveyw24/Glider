import * as THREE from 'three';
import { Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AnimationMixer } from 'three/src/animation/AnimationMixer.js';
import { Clock } from "three/src/core/Clock.js"

import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';
import MODEL from './scene.gltf';

class Fan extends Group {
    constructor(parent) {
        // Call parent Group() constructor
        super();

        const loader = new GLTFLoader();

        this.name = 'fan';
        loader.load(MODEL, (gltf) => {
            gltf.scene.scale.multiplyScalar(5);
            this.add(gltf.scene);
        });
        
        parent.addToUpdateList(this);
    }

    
    update(timeStamp) {
    }
}

export default Fan;
