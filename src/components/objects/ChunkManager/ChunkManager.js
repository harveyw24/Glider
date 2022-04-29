import * as THREE from 'three'
import { Group, Color, PlaneBufferGeometry, PlaneGeometry } from 'three';
import { ChunkLine } from '../ChunkLine';
import { Turbine } from '../Turbine';
import { Tree } from '../Tree';


// SET THESE TO CHANGE CHUNK DIMENSIONS
const groundY = -200;
const waterHeight = 0;
const chunkPxWidth = 1000;
const chunkVertexWidth = 100;

class ChunkManager extends Group {
    constructor(parent) {

        super();

        this.name = 'chunkManager';

        this.state = {
            gui: parent.state.gui,
            parent: parent,
            chunkWidth: chunkPxWidth,
            chunkVertWidth: chunkVertexWidth,
            totalVertWidth: chunkVertexWidth * 3, // chunkVertWidth * 3
            groundY: groundY,
            currentXOffset: 0,
            currentZOffset: 0,
            breathOffset: 5,
            breathLength: 5,
            octaves: 3,
            // amplitude: 1, // Does nothing
            exaggeration: 17,
            waterHeight: waterHeight,
            waterColor: new Color(50, 90, 145),
            bankColor: new Color(26, 143, 26),
            middleColor: new Color(113, 105, 105),
            peakColor: new Color(255, 255, 255),
            colorWiggle: 0.1,
            middleGradient: 0.5,
            randSeed: 3.8,
            freq: 4.4,
            currentOffset: 0,
            // maxTreeNum: 100,
            maxTreeNum: 10,
            maxCloudNum: 25,
            treeHeightMin: 0 + waterHeight,
            treeHeightMax: 50 + waterHeight,
            cloudYMin: 100 + groundY,
            cloudYMax: 150 + groundY,
            rewardIndex: 0,
            maxRewardNum: 10,
            maxRewardY: 100 + groundY,
            loadThreshold: 0.55,
            falling: 0,
            climbing: 0,
        }


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



        parent.addToUpdateList(this);

        // Populate GUI
        var folder1 = this.state.gui.addFolder('BREATH');
        folder1.add(this.state, 'breathLength', 0, 20);
        folder1.add(this.state, 'breathOffset', 0, 100);

        // Related to perlin noise, so call updateNoise which updates everything
        var folder0 = this.state.gui.addFolder('TERRAIN GENERATION FACTORS');
        folder0.add(this.state, 'octaves', 1, 16).name("Jaggedness").onChange(() => this.updateNoise());
        // folder0.add(this.state, 'amplitude', 0, 10).onChange(() => this.updateNoise());
        folder0.add(this.state, 'freq', 1, 10).name("Peaks").onChange(() => this.updateNoise());
        folder0.add(this.state, 'randSeed', 0, 10).name("World Seed").onChange(() => this.updateNoise());

        // Related to the look of the terrain and don't need to recalculate height map again
        var folder = this.state.gui.addFolder('TERRAIN LOOK FACTORS');
        folder.add(this.state, 'exaggeration', 0, 70).onChange(() => this.updateTerrainGeo());
        folder.add(this.state, 'waterHeight', -100, 100).name("Water Level").onChange(() => this.updateTerrainGeo());
        folder.add(this.state, 'colorWiggle', -1, 1).name("Color Texturing").onChange(() => this.updateTerrainGeo());
        folder.add(this.state, 'middleGradient', 0, 1).name("Peak Height").onChange(() => this.updateTerrainGeo());
        folder.addColor(this.state, 'waterColor').name("Water Color").onChange(() => this.updateTerrainGeo());
        folder.addColor(this.state, 'bankColor').name("Bank Color").onChange(() => this.updateTerrainGeo());
        folder.addColor(this.state, 'middleColor').name("Middle Color").onChange(() => this.updateTerrainGeo());
        folder.addColor(this.state, 'peakColor').name("Peak Color").onChange(() => this.updateTerrainGeo());

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
    update(timeStamp) {
        // Chunk positions are relative to terrain, so updating terrain position is sufficient
        this.position.z += 3;
        this.position.y += 0.25;

        // Gradual collision falling collision
        if (this.state.falling > 0) {
            if (this.state.falling < 40) {
                let offset = Math.pow(70 - this.state.falling, 0.3) / 3;
                this.state.falling += offset;
                this.position.y += offset;
            } else {
                this.state.falling = 0;
            }
        }

        // Gradual climbing
        if (this.state.climbing > 0) {
            if (this.state.climbing < 60) {
                let offset = Math.pow(100 - this.state.climbing, 0.3) / 3;
                this.state.climbing += offset;
                this.position.y -= offset;
            } else {
                this.state.climbing = 0;
            }
        }


        // Move first chunk forward when player passes the chunk
        if (this.position.z - this.anchor.z >= this.state.chunkWidth) {
            for (const chunkLine of this.chunkLines) {
                chunkLine.chunks[0].setChunkPosition(
                    chunkLine.chunks[0].position.x,
                    chunkLine.chunks[0].position.y,
                    chunkLine.chunks[chunkLine.chunks.length - 1].position.z - this.state.chunkWidth
                );
                chunkLine.chunks[0].updateNoise();
                chunkLine.chunks.push(chunkLine.chunks.shift());
            }

            this.anchor.z = this.position.z;
            console.log("NEW ANCHOR: ", this.anchor.z);
        }

        // Move chunklines left/right if player crosses loadThreshold
        if (this.position.x + this.chunkLines[0].position.x + (.5 - this.state.loadThreshold) * this.state.chunkWidth > 0) {
            this.chunkLines[1].setChunkLinePosition(
                this.chunkLines[0].position.x - this.state.chunkWidth,
                this.chunkLines[1].position.y,
                this.chunkLines[1].position.z
            )
            this.chunkLines[1].updateNoise();
            this.chunkLines.unshift(this.chunkLines.pop());
        } else if (this.position.x + this.chunkLines[0].position.x + (.5 + this.state.loadThreshold) * this.state.chunkWidth < 0) {
            this.chunkLines[0].setChunkLinePosition(
                this.chunkLines[1].position.x + this.state.chunkWidth,
                this.chunkLines[0].position.y,
                this.chunkLines[0].position.z
            )
            this.chunkLines[0].updateNoise();
            this.chunkLines.push(this.chunkLines.shift());
        }

        if (this.position.z + this.chunkLines[0].rewards[this.state.rewardIndex].position.z > 0) {
            this.updateReward();
        }

        this.getCurrentChunkLine();
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
        if (this.position.x + this.chunkLines[0].position.x + 0.5 * this.state.chunkWidth > 0) {
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
