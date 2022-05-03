// const THREE = require('three');
// import { Group } from 'three';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three'
import { Water } from 'three/examples/js/objects/Water.js';

class Watery extends THREE.Group {
    constructor(parent) {
        // Call parent Group() constructor
        super();

        const waterGeometry = new THREE.PlaneGeometry(1000, 1000);
        const water = new Water(
          waterGeometry,
          {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load('', function ( texture ) {
              texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }),
            alpha: 1.0,
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 3.7
          }
        );
        water.rotation.x =- Math.PI / 2;
        this.add(water);

        this.waterUniforms = water.material.uniforms;
    }

    update(timeStamp) {
        // Animates our water
        this.material.uniforms[timeStamp].value += 1.0 / 60.0;
    }

}

export default Watery;