import * as Dat from 'dat.gui';
import { Scene, Color } from 'three';
import { Flower, Land, Kite, Falcon, Paper, Terrain, ChunkManager} from 'objects';
import { BasicLights } from 'lights';
import * as THREE from 'three'

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


        
        // Add meshes to scene
        const land = new Land();
        // const falcon = new Falcon(this);
        const paper = new Paper(this)
        const lights = new BasicLights();
        // const terrain = new Terrain(this);
        const chunkManager = new ChunkManager(this);
        this.chunkManager = chunkManager;
        this.add(lights, paper, chunkManager);
        


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
