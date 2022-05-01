import * as Dat from 'dat.gui';
import { Scene, Color } from 'three';
import { Flower, Land, Kite, Falcon, Paper, Terrain, Airplane, ChunkManager, Turbine, Tree } from '../../objects';
import { BasicLights } from 'lights';
import * as THREE from 'three'
import { VertexNormalsHelper } from 'three/examples/jsm/helpers/VertexNormalsHelper.js'
import * as utils from "../../../js/utils.js"
import { Sky } from '../../objects/index.js';

class SeedScene extends Scene {
    constructor() {
        // Call parent Scene() constructor
        super();

        // Init state
        this.state = {
            gui: new Dat.GUI(), // Create GUI for scene
            rotationSpeed: 1,
            updateList: [],
            skyIndicator: 1,
            azimuth: 180,
            elevation: 5,
        };

        // Set background to a nice color
        this.background = new Color(0x7ec0ee);
        this.fogColor = new Color(0xd19264);

        // Add fog
        this.fog = new THREE.FogExp2(this.fogColor, 0.0015);
        // this.fog =  new THREE.Fog(0xADD8E6, 10, 1500);

        // Add meshes to scene
        // const land = new Land();
        // const paper = new Paper(this)
        const airplane = new Airplane(this)

        // LIGHTING
        this.lights = new BasicLights();

        const chunkManager = new ChunkManager(this);
        this.chunkManager = chunkManager;

        this.sky = new Sky();
        this.sky.scale.setScalar(1000);
        console.log(this.sky.position);

        this.sun = new THREE.Vector3();

        this.add(this.lights, this.sky, airplane, chunkManager);
        // this.add(this.hemiLight, this.dirLight, this.sky, airplane, chunkManager);

        // object hitbox testing
        // const obj1 = new THREE.Object3D();
        // const obj2 = new THREE.Object3D();
        // const turbine = new Turbine(this);
        // obj1.add(turbine);
        // obj2.add(turbine);
        // obj1.position.set(-10, 0, -20);
        // obj2.position.set(10, 0, -20);
        // this.add(obj1);
        // this.add(obj2);

        // for (let i = 0; i < 100; i++) {
        //     const tree1 = new Tree(this);
        //     this.add(tree1);
        //     tree1.position.set(5 * (i - 50), 0, -50);
        //     tree1.visible = false;
        // }



        // player hitbox visualization
        // let geo = new THREE.SphereGeometry(.1, 7, 8);
        // let material = new THREE.MeshBasicMaterial({ color: 0x000000 });
        // let mesh = new THREE.Mesh(geo, material);
        // this.add(mesh);

        // Populate GUI
        this.state.gui.add(this.state, 'rotationSpeed', -5, 5);
    }

    // Initialize sky with gui controls
    initSky(renderer, camera) {
        // GUI

        const effectController = {
            turbidity: 10,
            rayleigh: 3,
            mieCoefficient: 0.005,
            mieDirectionalG: 0.6,
            elevation: 5,
            azimuth: 180,
            exposure: renderer.toneMappingExposure
        };

        let sky = this.sky
        let sun = this.sun
        let scene = this

        function guiChanged() {

            const uniforms = sky.material.uniforms;
            uniforms['turbidity'].value = effectController.turbidity;
            uniforms['rayleigh'].value = effectController.rayleigh;
            uniforms['mieCoefficient'].value = effectController.mieCoefficient;
            uniforms['mieDirectionalG'].value = effectController.mieDirectionalG;

            const phi = THREE.MathUtils.degToRad(90 - effectController.elevation);
            const theta = THREE.MathUtils.degToRad(effectController.azimuth);

            sun.setFromSphericalCoords(1, phi, theta);

            uniforms['sunPosition'].value.copy(sun);

            renderer.toneMappingExposure = effectController.exposure;
            renderer.render(scene, camera);

        }

        this.state.gui.add(effectController, 'turbidity', 0.0, 20.0, 0.1).onChange(guiChanged);
        this.state.gui.add(effectController, 'rayleigh', 0.0, 4, 0.001).onChange(guiChanged);
        this.state.gui.add(effectController, 'mieCoefficient', 0.0, 0.1, 0.001).onChange(guiChanged);
        this.state.gui.add(effectController, 'mieDirectionalG', 0.0, 1, 0.001).onChange(guiChanged);
        this.state.gui.add(effectController, 'elevation', 0, 90, 0.1).onChange(guiChanged);
        this.state.gui.add(effectController, 'azimuth', - 180, 180, 0.1).onChange(guiChanged);
        this.state.gui.add(effectController, 'exposure', 0, 1, 0.0001).onChange(guiChanged);

        guiChanged();
    }

    addToUpdateList(object) {
        this.state.updateList.push(object);
    }

    update(timeStamp) {
        // this.spotLight.position.z += 3;
        const { rotationSpeed, updateList } = this.state;
        // this.rotation.y = (rotationSpeed * timeStamp) / 10000;

        let skyUniforms = this.sky.material.uniforms;

        // Oscillating rayleigh
        let rayleigh = skyUniforms['rayleigh'].value
        if (rayleigh >= 10 || rayleigh <= 2) {
            this.state.skyIndicator *= -1;
        }
        skyUniforms['rayleigh'].value += 0.01 * this.state.skyIndicator;


        // Sun rising and falling
        let curAzimuth = this.state.azimuth % 360;

        let delta = 180 - curAzimuth
        this.state.elevation = Math.min(6, Math.max(0, this.state.elevation + Math.sign(delta)*Math.pow(Math.abs(delta), 0.2) / 180));

        if (curAzimuth < 100 || curAzimuth > 260 ) {
            // console.log("NIGHT");
            this.state.azimuth += 3;
            this.state.elevation = 0;
        }
        else if (curAzimuth < 150 || curAzimuth > 210) {
            // console.log("SUN SETTING/RISING");
            let weight = Math.abs(180 - curAzimuth) / 30;
            this.state.azimuth += 0.06 * Math.pow(weight, 4);
        } else {
            // console.log("DAY");
            this.state.azimuth += 0.06;
        }
        const phi = THREE.MathUtils.degToRad(90 - this.state.elevation);
        const theta = THREE.MathUtils.degToRad(this.state.azimuth);
        this.sun.setFromSphericalCoords(1, phi, theta);
        skyUniforms['sunPosition'].value.copy(this.sun);

        // Update lighting
        this.lights.hemiLight.intensity = 0.4 + this.state.elevation / 12;
        this.lights.dirLight.intensity = 0.3 + this.state.elevation / 10;
        this.fog.color = this.fogColor.clone().multiplyScalar(0.2 + this.state.elevation / 8);


        // Call update for each object in the updateList
        for (const obj of updateList) {
            obj.update(timeStamp);
        }
    }
}

export default SeedScene;
