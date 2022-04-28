import { Group } from 'three';
import { Chunk } from '../Chunk';
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
            [0, 0, -2.5 * this.CMState.chunkWidth],
        ];
        this.chunks = [];
        for (let i = 0; i < coordinates.length; i++) {
            const new_chunk = new Chunk(this, coordinates[i][0], coordinates[i][1], coordinates[i][2]);
            this.add(new_chunk);
            this.chunks.push(new_chunk);
        }


        // setup "rewards"; i.e. objectives
        this.rewards = Array(this.CMState.maxRewardNum);
        for (let k = 0; k < this.CMState.maxRewardNum; k++) {
            const reward = new Turbine(this);
            this.rewards[k] = reward;
            this.updateRewardAtIndex(k);
            this.add(reward);
        }


    }

    setChunkLinePosition(x, y, z) {
        this.position.x = x;
        this.position.z = z;
        this.position.y = y;
    }


    getRewardJCoord(rewardIndex) {
        return Math.floor(this.CMState.chunkVertWidth * (this.CMState.maxRewardNum - rewardIndex - 1) / this.CMState.maxRewardNum);
    }

    updateRewardAtIndex(rewardIndex) {
        const reward = this.rewards[rewardIndex];
        const jCoord = this.getRewardJCoord(rewardIndex);
        const pos = this.chunks[1].getPositionAtCoords(Math.floor(random(0, this.CMState.chunkVertWidth - 1)), jCoord);
        pos.add(this.chunks[1].position);
        reward.position.set(pos.x, random(pos.y, this.CMState.maxRewardY), pos.z);
    }


    updateNoise() {
        for (const chunk of this.chunks) chunk.updateNoise();
    }

    updateTerrainGeo() {
        for (const chunk of this.chunks) chunk.updateTerrainGeo();
    }


    disposeOf() {
        this.chunk.disposeOf()
        this.remove(this.chunk)
    }

}

export default ChunkLine;
