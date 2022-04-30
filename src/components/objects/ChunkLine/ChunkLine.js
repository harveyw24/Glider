import { Group } from 'three';
import { Chunk } from '../Chunk';
import { Tree } from '../Tree';
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

        this.treeIndex = 0;
        this.trees = Array.from(Array(this.CMState.maxTreeNum));
        for (let k = 0; k < this.CMState.maxTreeNum; k++) {
            const tree = new Cloud(this);
            this.trees[k] = tree;
            this.updateTreeAtIndex(k);
            this.add(tree);
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

    cycleChunks() {
        this.chunks[0].setChunkPosition(
            this.chunks[0].position.x,
            this.chunks[0].position.y,
            this.chunks[this.chunks.length - 1].position.z - this.state.chunkManager.state.chunkWidth
        );
        if (this.state.chunkManager.state !== this.chunks[0].CMState) this.chunks[0].updateNoise(this.state.chunkManager.state);
        else this.chunks[0].updateNoise();
        this.chunks.push(this.chunks.shift());
    }

    getCurrentTree() {
        return this.trees[this.treeIndex];
    }

    skipRemainingTrees() {
        this.treeIndex = 0;
    }

    updateTree() {
        if (this.updateTreeAtIndex(this.treeIndex)) {
            this.treeIndex++;
            if (this.treeIndex == this.CMState.maxTreeNum) this.treeIndex = 0;
        } else {
            this.skipRemainingTrees();
        }
    }

    // returns true if successful; false if no available tree to use
    updateTreeAtIndex(treeIndex) {
        const pos = this.chunks[1].treePositions[treeIndex];
        if (pos === null) return false;
        pos.add(this.chunks[1].position);

        const tree = this.trees[treeIndex];
        tree.position.set(pos.x, pos.y, pos.z);
        // tree.position.set(-this.position.x * .95, -50, pos.z);
        return true;
    }

    getRewardICoord(rewardIndex) {
        return Math.floor(this.CMState.chunkVertWidth * (this.CMState.maxRewardNum - rewardIndex - 1) / this.CMState.maxRewardNum);
    }

    updateRewardAtIndex(rewardIndex) {
        const reward = this.rewards[rewardIndex];
        const iCoord = this.getRewardICoord(rewardIndex);

        // try to find a pos which is below the rewardHeightMax
        let pos;
        for (let i = 0; i < 10; i++) {
            pos = this.chunks[1].getPositionAtCoords(iCoord, Math.floor(random(0, this.CMState.chunkVertWidth - 1)));
            if (pos.y <= this.CMState.rewardHeightMax + this.CMState.groundY) break;
            if (i == 9) console.log("couldn't find a good spot!");
        }

        pos.add(this.chunks[1].position);
        reward.position.set(pos.x, random(pos.y, this.CMState.rewardHeightMax + this.CMState.groundY), pos.z);
        // reward.position.set(-this.position.x * .9, -50, pos.z);
    }


    updateNoise(CMState) {
        if (CMState !== undefined) this.CMState = CMState;
        for (const chunk of this.chunks) chunk.updateNoise(); // CMState update should NOT propagate to chunks
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
