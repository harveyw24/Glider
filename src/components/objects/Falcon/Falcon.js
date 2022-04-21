import * as THREE from 'three';
import { Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AnimationMixer } from 'three/src/animation/AnimationMixer.js';
import { Clock } from "three/src/core/Clock.js"

import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';
import MODEL from './scene.gltf';

class Falcon extends Group {
    constructor(parent) {
        // Call parent Group() constructor
        super();

        // Init state
        // this.state = {
        //     gui: parent.state.gui,
        //     bob: true,
        //     spin: this.spin.bind(this),
        //     twirl: 0,
        // };

        const loader = new GLTFLoader();

        this.name = 'falcon';
        loader.load(MODEL, (gltf) => {
            this.box = new THREE.Box3().setFromObject(gltf.scene);
            this.add(gltf.scene);
        });
        // this.box = new THREE.Box3().setFromObject(this)

        // Load object
        // const loader = new GLTFLoader();

        // const assetLoader = new GLTFLoader();

        // this.name = 'falcon';
        // let mixer;
        // assetLoader.load(MODEL, function(gltf) {
        //     const model = gltf.scene;
        //     // scene.add(model);
        //     mixer = new THREE.AnimationMixer(model);
        //     const clips = gltf.animations;

        //     // Play a certain animation
        //     const clip = THREE.AnimationClip.findByName(clips, 'Take 001');
        //     const action = mixer.clipAction(clip);
        //     action.play();

        //     // Play all animations at the same time
        //     clips.forEach(function(clip) {
        //         const action = mixer.clipAction(clip);
        //         action.play();
        //     });

        // }, undefined, function(error) {
        //     console.error(error);
        // });

        // const clock = new THREE.Clock();
        // function animate() {
        //     if(mixer)
        //         mixer.update(clock.getDelta());
        //     renderer.render(scene, camera);
        // }

        // renderer.setAnimationLoop(animate);

        // this.name = 'falcon';
        // let mixer;
        // let clock = new Clock();
        // loader.load(MODEL, function(gltf) {
        //     this.add(gltf.scene);
        //     mixer = new AnimationMixer(gltf.scene);
        //     gltf.animations.forEach((clip) => {mixer.clipAction(clip).play(); });
        // });
        // console.log(mixer)

        // let delta = clock.getDelta();
        // mixer.update( delta )

        // Add self to parent's update list
        parent.addToUpdateList(this);

        // Populate GUI
        // this.state.gui.add(this.state, 'bob');
        // this.state.gui.add(this.state, 'spin');
    }

    // spin() {
    //     // Add a simple twirl
    //     this.state.twirl += 6 * Math.PI;

    //     // Use timing library for more precice "bounce" animation
    //     // TweenJS guide: http://learningthreejs.com/blog/2011/08/17/tweenjs-for-smooth-animation/
    //     // Possible easings: http://sole.github.io/tween.js/examples/03_graphs.html
    //     const jumpUp = new TWEEN.Tween(this.position)
    //         .to({ y: this.position.y + 1 }, 300)
    //         .easing(TWEEN.Easing.Quadratic.Out);
    //     const fallDown = new TWEEN.Tween(this.position)
    //         .to({ y: 0 }, 300)
    //         .easing(TWEEN.Easing.Quadratic.In);

    //     // Fall down after jumping up
    //     jumpUp.onComplete(() => fallDown.start());

    //     // Start animation
    //     jumpUp.start();
    // }

    update(timeStamp) {
        // if (this.state.bob) {
        //     // Bob back and forth
        //     this.rotation.z = 0.05 * Math.sin(timeStamp / 300);
        // }
        // if (this.state.twirl > 0) {
        //     // Lazy implementation of twirl
        //     this.state.twirl -= Math.PI / 8;
        //     this.rotation.y += Math.PI / 8;
        // }

        // // Advance tween animations, if any exist
        // TWEEN.update();
    }
}

export default Falcon;
