import { Group, Color, PlaneBufferGeometry, PlaneGeometry } from 'three';
import { ChunkLine } from '../ChunkLine';
import { Turbine } from '../Turbine';
import { Tree } from '../Tree';

function random(min, max) {
    return Math.random() * (max - min) + min;
}

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
            maxTurbineNum: 0,
            maxCloudNum: 25,
            turbineHeightMin: 0 + waterHeight,
            turbineHeightMax: 50 + waterHeight,
            cloudYMin: 100 + groundY,
            cloudYMax: 150 + groundY,
            falling: 0,
            climbing: 0
        }


        this.anchor = this.position.clone();
        const coordinates = [
            [0, 0, -.5 * this.state.chunkWidth],
            [0, 0, -1.5 * this.state.chunkWidth],
        ];


        this.chunks = [];
        for (let i = 0; i < coordinates.length; i++) {
            const new_chunk = new ChunkLine(this, coordinates[i][0], coordinates[i][1], coordinates[i][2]);
            this.add(new_chunk);
            this.chunks.push(new_chunk);
        }


        // setup "rewards"; i.e. objectives
        this.rewardIndex = 0;
        this.maxRewardNum = 10;
        this.maxRewardY = 100 + groundY;
        this.rewards = Array.from(Array(this.maxRewardNum), () => new Turbine(parent));
        this.currentReward = this.rewards[this.rewardIndex];
        for (let k = 0; k < this.maxRewardNum; k++) {
            this.updateReward();
            this.add(this.currentReward);
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

    getRewardJCoord(rewardIndex) {
        return Math.floor(this.state.chunkVertWidth * (this.maxRewardNum - rewardIndex - 1) / this.maxRewardNum);
    }

    updateReward() {
        const jCoord = this.getRewardJCoord(this.rewardIndex);
        const pos = this.chunks[1].chunk.getPositionAtCoords(Math.floor(random(0, this.state.chunkVertWidth - 1)), jCoord);
        pos.add(this.chunks[1].position);
        this.currentReward.position.set(pos.x, random(pos.y, this.maxRewardY), pos.z);
        // this.currentReward.position.set(0, 0, pos.z);

        this.rewardIndex++;
        if (this.rewardIndex == this.maxRewardNum) this.rewardIndex = 0;
        this.currentReward = this.rewards[this.rewardIndex];
    }


    updateNoise() {
        for (const chunk of this.chunks) chunk.updateNoise();
    }

    updateTerrainGeo() {
        for (const chunk of this.chunks) chunk.updateTerrainGeo();
    }

    // the key invariant to maintain here is that the plane is within the first chunk (i.e. this.chunks[0]);
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
        console.log(this.state.climbing);
        if (this.state.climbing > 0) {
            if (this.state.climbing < 50) {
                let offset = Math.pow(80 - this.state.climbing, 0.3) / 3;
                this.state.climbing += offset;
                this.position.y -= offset;
            } else {
                this.state.climbing = 0;
            }
        }


        if (this.position.z - this.anchor.z >= this.state.chunkWidth) {
            this.chunks[0].setChunkPosition(
                this.chunks[0].position.x,
                this.chunks[0].position.y,
                this.chunks[this.chunks.length - 1].position.z - this.state.chunkWidth
            );
            this.chunks[0].updateNoise();
            this.chunks.push(this.chunks.shift());

            this.anchor.z = this.position.z;
            console.log(this.anchor.z);
        }

        if (this.position.z + this.rewards[this.rewardIndex].position.z > 0) {
            this.updateReward();
        }
    }
}

export default ChunkManager;