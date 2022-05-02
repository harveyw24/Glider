import { Group } from 'three';
import { Chunk } from '../Chunk';
import { Cloud } from '../Cloud';
import { Turbine } from '../Turbine';

function random(min, max) {
    return Math.random() * (max - min) + min;
}

class ChunkLine extends Group {
    constructor(parent, xOffset, yOffset, zOffset) {
        // Call parent Group() constructor
        super();

        // Init state
        this.state = {
            gui: parent.state.gui,
            parent: parent,
            chunkManager: parent,
        };
        this.CMState = this.state.chunkManager.state;
        this.setChunkLinePosition(xOffset, yOffset, zOffset);



        const coordinates = [
            [0, 0, -.5 * this.CMState.chunkWidth],
            [0, 0, -1.5 * this.CMState.chunkWidth],
            // [0, 0, -2.5 * this.CMState.chunkWidth],
        ];
        this.chunks = [];
        for (let i = 0; i < coordinates.length; i++) {
            const new_chunk = new Chunk(this, coordinates[i][0], coordinates[i][1], coordinates[i][2]);
            this.add(new_chunk);
            this.chunks.push(new_chunk);
        }



    }

    setChunkLinePosition(x, y, z) {
        this.position.x = x;
        this.position.z = z;
        this.position.y = y;
    }

    cycleChunks() {
        this.chunks[0].setChunkPosition(
            this.chunks[0].position.x,
            this.chunks[0].position.y,
            this.chunks[this.chunks.length - 1].position.z - this.state.chunkManager.state.chunkWidth
        );
        if (this.state.chunkManager.state !== this.chunks[0].CMState) this.chunks[0].updateNoise(this.state.chunkManager.state);
        else this.chunks[0].updateNoise();
        this.chunks[0].hideObstacles();
        this.chunks[0].hideRewards();
        this.chunks.push(this.chunks.shift());
    }



    updateNoise() {
        // CMState is not snapshotted in chunkLine!
        // if (CMState !== undefined) this.CMState = CMState;
        for (const chunk of this.chunks) chunk.updateNoise(); // CMState update should NOT propagate to chunks
    }

    updateTerrainGeo() {
        for (const chunk of this.chunks) chunk.updateTerrainGeo();
    }


}

export default ChunkLine;
