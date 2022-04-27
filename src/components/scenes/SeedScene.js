import * as Dat from 'dat.gui';
import { Scene, Color } from 'three';
import { Flower, Land, Kite, Falcon, Paper, Terrain, Airplane, ChunkManager} from 'objects';
import { BasicLights } from 'lights';
import * as THREE from 'three'
import { VertexNormalsHelper } from 'three/examples/jsm/helpers/VertexNormalsHelper.js'
import * as utils from "../../js/utils.js"

class SeedScene extends Scene {
    constructor() {
        // Call parent Scene() constructor
        super();

        // Init state
        this.state = {
            gui: new Dat.GUI(), // Create GUI for scene
            rotationSpeed: 1,
            updateList: [],
        };

        // Set background to a nice color
        this.background = new Color(0x7ec0ee);

        // Add fog
        this.fog =  new THREE.FogExp2(0xADD8E6, 0.0015);
        // this.fog =  new THREE.Fog(0xADD8E6, 10, 1500);

        // Add meshes to scene
        const land = new Land();
        // const paper = new Paper(this)
        const airplane = new Airplane(this)
        const lights = new BasicLights();
        const chunkManager = new ChunkManager(this);
        this.chunkManager = chunkManager;
        this.add(lights, land, airplane, chunkManager);
        


        // Populate GUI
        this.state.gui.add(this.state, 'rotationSpeed', -5, 5);
    }

    addToUpdateList(object) {
        this.state.updateList.push(object);
    }

    update(timeStamp) {
        const { rotationSpeed, updateList } = this.state;
        // this.rotation.y = (rotationSpeed * timeStamp) / 10000;

        // Call update for each object in the updateList
        for (const obj of updateList) {
            obj.update(timeStamp);
        }
    }
}

export default SeedScene;
