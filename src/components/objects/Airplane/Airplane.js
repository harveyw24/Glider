import { Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three'
import MODEL from './scene.gltf';

class Airplane extends Group {
    constructor(parent) {
        // Call parent Group() constructor
        super();


        this.state = {
            mixer: null,
            prevTimeStamp: null,
            parent: parent,
            animation: null,
            action: null,
        };

        this.name = 'plane';
        this.tip = new THREE.Vector3(0,0,0);
        this.addPlane()

        // Add update list
        parent.addToUpdateList(this);
    }

    addPlane() {
        const loader = new GLTFLoader();
        loader.load(MODEL, (gltf) => {
            gltf.scene.scale.multiplyScalar(3);
            // gltf.scene.position.x = 0; 
            // gltf.scene.position.y = 0;
            // gltf.scene.position.z = 0;
            const box = new THREE.Box3().setFromObject( gltf.scene, true);
            const center = box.getCenter( new THREE.Vector3() );

            gltf.scene.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI);
            gltf.scene.position.x += ( gltf.scene.position.x - center.x );
            gltf.scene.position.y += ( gltf.scene.position.y - center.y );
            gltf.scene.position.z += ( gltf.scene.position.z - center.z );

            // add mixer to state
            this.state.mixer = new THREE.AnimationMixer(gltf.scene);
    
            const clip = gltf.animations[0]
            this.state.action = this.state.mixer.clipAction(clip)
            this.state.action.play();
            
            this.box = box;

            this.add(gltf.scene);
        });
    }

    update(timeStamp) {
        if (this.state.prevTimeStamp === null) {
            this.state.prevTimeStamp = timeStamp;
          }
    
          // calculate delta
          const delta = (timeStamp - this.state.prevTimeStamp)/1000;
    
          // update previous time stamp
          this.state.prevTimeStamp = timeStamp;
    
          // update animation
          this.state.mixer.update(delta);
    }

}

export default Airplane;