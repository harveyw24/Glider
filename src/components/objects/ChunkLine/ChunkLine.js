import { Group } from 'three';
import { Terrain } from '../Terrain';

class ChunkLine extends Group {
    constructor(parent, xOffset, yOffset, zOffset) {
        // console.log("CONSTRUCTOR CHUNK x: " + xOffset + " t: " + yOffset + " z: " + zOffset)
        // Call parent Group() constructor
        super();

        // Init state
        this.state = {
            gui: parent.state.gui,
            parent: parent,
            chunkManager: parent,
        };

        // feed in the parent (chunk manager) as it has the proper terrain variables
        this.setChunkPosition(xOffset, yOffset, zOffset);
        this.terrain = new Terrain(this)
        this.add(this.terrain);


    }


    updateNoise() {
        this.terrain.updateNoise();
    }

    updateTerrainGeo() {
        this.terrain.updateTerrainGeo();
    }

    setChunkPosition(x, y, z) {
        this.position.x = x;
        this.position.z = z;
        this.position.y = y;
        this.updateMatrix();
    }

    disposeOf() {
        this.terrain.disposeOf()
        this.remove(this.terrain)
    }

}

export default ChunkLine;
