import * as THREE from 'three'
import { Group, Color, PlaneBufferGeometry, PlaneGeometry, NoToneMapping } from 'three';
import { ChunkLine } from '../ChunkLine';
import { Turbine } from '../Turbine';
import { Tree } from '../Tree';


// SET THESE TO CHANGE CHUNK DIMENSIONS
const groundY = -200;
const chunkPxWidth = 1000;
const chunkVertexWidth = 100;

const default_biome = {
    breathOffset: 5,
    breathLength: 5,
    octaves: 3,
    exaggeration: 17,
    waterHeight: 0,
    waterColor: new Color(50, 90, 145),
    bankColor: new Color(26, 143, 26),
    middleColor: new Color(113, 105, 105),
    peakColor: new Color(255, 255, 255),
    colorWiggle: 0.1,
    middleGradient: 0.5,
    randSeed: 3.8,
    freq: 4.4,
    gamma: 0, // if gamma is zero, then no gamma is applied
    smoothPeaks: false,
    maxTreeNum: 20,
    treeHeightMin: 0,
    treeHeightMax: 50,
    maxCloudNum: 25,
    cloudHeightMin: 100,
    cloudHeightMax: 150,
    maxRewardNum: 10,
    rewardHeightMax: 100,
};
const modifiableFields = Object.keys(default_biome);

class ChunkManager extends Group {
    constructor(parent) {

        super();

        this.name = 'chunkManager';

        this.state = {
            gui: parent.state.gui,
            parent: parent,
            chunkWidth: chunkPxWidth,
            chunkVertWidth: chunkVertexWidth,
            segmentWidth: chunkPxWidth / (chunkVertexWidth - 1),
            groundY: groundY,
            rewardIndex: 0,
            loadThreshold: 0.55,
            falling: 0,
            climbing: 0,
            ...default_biome,
        }


        // invariant: at z-chunk change, (anchor.z + chunkwidth/2) + currentChunk.position.z = 0
        // invariant: at x-chunk change, (anchor.x + chunkwidth/2) + currentChunk.position.x = 0
        this.anchor = new THREE.Vector3();
        const coordinates = [
            [-this.state.chunkWidth / 2, 0, 0],
            [this.state.chunkWidth / 2, 0, 0],
        ];


        this.chunkLines = [];
        for (let i = 0; i < coordinates.length; i++) {
            const chunk = new ChunkLine(this, coordinates[i][0], coordinates[i][1], coordinates[i][2]);
            this.add(chunk);
            this.chunkLines.push(chunk);
        }



        // parent.addToUpdateList(this);

        // Populate GUI
        const folder1 = this.state.gui.addFolder('BREATH');
        folder1.add(this.state, 'breathLength', 0, 20);
        folder1.add(this.state, 'breathOffset', 0, 100);

        // Related to perlin noise, so call updateNoise which updates everything
        const folder0 = this.state.gui.addFolder('TERRAIN GENERATION FACTORS');
        folder0.add(this.state, 'octaves', 1, 16).name("Jaggedness").onChange(() => this.updateNoise());
        // folder0.add(this.state, 'amplitude', 0, 10).onChange(() => this.updateNoise());
        folder0.add(this.state, 'freq', 1, 10).name("Peaks").onChange(() => this.updateNoise());
        folder0.add(this.state, 'randSeed', 0, 10).name("World Seed").onChange(() => this.updateNoise());

        // Related to the look of the terrain and don't need to recalculate height map again
        const folder = this.state.gui.addFolder('TERRAIN LOOK FACTORS');
        folder.add(this.state, 'exaggeration', 0, 70).onChange(() => this.updateTerrainGeo());
        folder.add(this.state, 'waterHeight', -100, 100).name("Water Level").onChange(() => this.updateTerrainGeo());
        folder.add(this.state, 'colorWiggle', -1, 1).name("Color Texturing").onChange(() => this.updateTerrainGeo());
        folder.add(this.state, 'middleGradient', 0, 1).name("Peak Height").onChange(() => this.updateTerrainGeo());
        folder.addColor(this.state, 'waterColor').name("Water Color").onChange(() => this.updateTerrainGeo());
        folder.addColor(this.state, 'bankColor').name("Bank Color").onChange(() => this.updateTerrainGeo());
        folder.addColor(this.state, 'middleColor').name("Middle Color").onChange(() => this.updateTerrainGeo());
        folder.addColor(this.state, 'peakColor').name("Peak Color").onChange(() => this.updateTerrainGeo());
        folder.add(this.state, 'gamma').name("Terrain Gamma").onChange(() => this.updateTerrainGeo());
        folder.add(this.state, 'smoothPeaks').name("Smooth Peaks").onChange(() => this.updateTerrainGeo());

        folder.open();

    }

    updateNoise() {
        for (const chunkLine of this.chunkLines) chunkLine.updateNoise();
    }

    updateTerrainGeo() {
        for (const chunkLine of this.chunkLines) chunkLine.updateTerrainGeo();
    }

    // the key invariant to maintain here is that the plane is within the first chunk (i.e. this.chunkLines[0]);
    // if the plane leaves the first chunk, then the first chunk needs to be popped and moved to the back
    update(timeStamp, speedLevel) {
        // Chunk positions are relative to terrain, so updating terrain position is sufficient
        this.position.z += 3 * speedLevel;
        this.position.y += 0.25 * speedLevel;

        for (let chunkLine of this.chunkLines) {
            for (let reward of chunkLine.rewards) {
                reward.update(timeStamp);
            }
            for (let chunk of chunkLine.chunks) {
                for (let cloud of chunk.clouds) {
                    cloud.update(timeStamp);
                }
            }
        }

        // Gradual collision falling collision
        if (this.state.falling > 0) {
            if (this.state.falling < 40) {
                const offset = Math.pow(70 - this.state.falling, 0.3) / 3;
                this.state.falling += offset;
                this.position.y += offset;
            } else {
                this.state.falling = 0;
            }
        }

        // Gradual climbing
        if (this.state.climbing > 0) {
            if (this.state.climbing < 80) {
                const offset = Math.pow(120 - this.state.climbing, 0.3) / 2;
                this.state.climbing += offset;
                this.position.y -= offset;
            } else {
                this.state.climbing = 0;
            }
        }


        // reward/obstacle updates should happen before moving chunks, so that no trees/obstacles are missed
        if (this.position.z + this.getCurrentReward().position.z > 0) this.updateReward();

        let visibleTrees = 0;
        for (const chunkLine of this.chunkLines) {
            while (true) {
                const chunk = chunkLine.chunks[0];
                const currentTree = chunk.getCurrentTree();

                if (currentTree !== null && this.position.z + currentTree.position.z + chunk.position.z > 0) chunk.hideCurrentTree();
                else break;
            }
            while (true) {
                const chunk = chunkLine.chunks[1];
                const nextTree = chunk.getNextTree();

                if (nextTree !== null && this.position.z + nextTree.position.z + chunk.position.z > -this.state.chunkWidth) chunk.showNextTree();
                else break;
            }

            for (const chunk of chunkLine.chunks) {
                for (const tree of chunk.trees) {
                    if (tree.visible) visibleTrees++;
                }
            }
        }
        console.log("visible trees: ", visibleTrees);

        // to keep the chunks in the vicinity of the player:
        // z-position is changed chunk-wise     (chunkLine.position.z = 0)
        // x-position is changed chunkLine-wise     (chunk.position.x = 0)

        // Move first chunk forward when player passes the chunk
        if (this.position.z - this.anchor.z >= this.state.chunkWidth) {
            if (this.state.rewardIndex != 0) console.log("Some rewards were not moved forward! this probably shouldn't happen unless you're going very fast");
            this.updateRemainingRewards();

            for (const chunkLine of this.chunkLines) chunkLine.cycleChunks();

            // invariant: at z-chunk change, (anchor.z + chunkwidth/2) + currentChunk.position.z = 0
            this.anchor.z = -this.chunkLines[0].chunks[0].position.z - this.state.chunkWidth / 2;
            console.log("NEW ANCHOR: ", this.anchor.x, this.anchor.y, this.anchor.z);
        }

        // Move chunklines left/right if player crosses loadThreshold
        if (this.position.x - this.anchor.x > this.state.loadThreshold * this.state.chunkWidth) {
            this.chunkLines[1].setChunkLinePosition(
                this.chunkLines[0].position.x - this.state.chunkWidth,
                this.chunkLines[1].position.y,
                this.chunkLines[1].position.z
            )
            this.chunkLines[1].updateNoise();
            this.chunkLines.unshift(this.chunkLines.pop());

            // invariant: at x-chunk change, anchor.x + currentChunk.position.x + chunkwidth/2 = 0
            this.anchor.x = -this.chunkLines[0].position.x - this.state.chunkWidth / 2;
            console.log("NEW ANCHOR: ", this.anchor.x, this.anchor.y, this.anchor.z);

        } else if (this.position.x - this.anchor.x < -this.state.loadThreshold * this.state.chunkWidth) {
            this.chunkLines[0].setChunkLinePosition(
                this.chunkLines[1].position.x + this.state.chunkWidth,
                this.chunkLines[0].position.y,
                this.chunkLines[0].position.z
            )
            this.chunkLines[0].updateNoise();
            this.chunkLines.push(this.chunkLines.shift());

            this.anchor.x = -this.chunkLines[0].position.x - this.state.chunkWidth / 2;
            console.log("NEW ANCHOR: ", this.anchor.x, this.anchor.y, this.anchor.z);
        }



    }

    updateBiome(newBiome) {
        newBiome = { ...default_biome, ...newBiome };
        for (const [name, value] of Object.entries(newBiome)) {
            if (modifiableFields.includes(name)) this.state[name] = value;
            else console.log("Attempting to change field " + name + ", which is unmodifiable/not a field.");
        }
    }


    updateRemainingRewards() {
        while (this.state.rewardIndex != 0) this.updateReward();
    }

    updateReward() {
        for (const chunkLine of this.chunkLines) chunkLine.updateRewardAtIndex(this.state.rewardIndex);
        this.state.rewardIndex++;
        if (this.state.rewardIndex == this.state.maxRewardNum) this.state.rewardIndex = 0;
    }

    getCurrentReward() {
        return this.getCurrentChunkLine().rewards[this.state.rewardIndex];
    }

    getCurrentChunkLine() {
        if (this.position.x > this.anchor.x) {
            return this.chunkLines[0];
        } else {
            return this.chunkLines[1];
        }
    }
    getCurrentChunk() {
        return this.getCurrentChunkLine().chunks[0];
    }
}

export default ChunkManager;
