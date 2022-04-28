import { Group } from 'three';
import { Chunk } from '../Chunk';

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
        
        this.CMState = this.state.chunkManager.state;
        
        
        // this.chunks = [];
        // for (let i = 0; i < coordinates.length; i++) {
        //     const new_chunk = new ChunkLine(this, coordinates[i][0], coordinates[i][1], coordinates[i][2]);
        //     this.add(new_chunk);
        //     this.chunks.push(new_chunk);
        // }

        // 
        // // setup "rewards"; i.e. objectives
        // this.rewardIndex = 0;
        // this.maxRewardNum = 10;
        // this.maxRewardY = 100 + groundY;
        // this.rewards = Array.from(Array(this.maxRewardNum), () => new Tree());
        // this.currentReward = this.rewards[this.rewardIndex];
        // for (let k = 0; k < this.maxRewardNum; k++) {
        //     this.updateReward();
        //     this.add(this.currentReward);
        // }

        // feed in the parent (chunk manager) as it has the proper chunk variables
        this.setChunkPosition(xOffset, yOffset, zOffset);
        this.chunk = new Chunk(this)
        this.add(this.chunk);


    }


    updateNoise() {
        this.chunk.updateNoise();
    }

    updateTerrainGeo() {
        this.chunk.updateTerrainGeo();
    }

    setChunkPosition(x, y, z) {
        this.position.x = x;
        this.position.z = z;
        this.position.y = y;
        this.updateMatrix();
    }

    disposeOf() {
        this.chunk.disposeOf()
        this.remove(this.chunk)
    }

}

export default ChunkLine;
