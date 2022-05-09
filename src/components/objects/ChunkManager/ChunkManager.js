import * as THREE from 'three'
import { Group, Color } from 'three';
import { ChunkLine } from '../ChunkLine';
import { Cloud } from '../Cloud';
import { Turbine } from '../Turbine';
import { Obstacle } from '../Obstacle';
import { Water } from 'three/examples/jsm/objects/Water.js';


// SET THESE TO CHANGE CHUNK DIMENSIONS
const groundY = -200;
const chunkPxWidth = 1000;
const chunkVertexWidth = 100;

// Default values for biome conditions
const default_biome = {
    biome: "default",
    breathOffset: 5,
    breathLength: 5,
    octaves: 3,
    exaggeration: 17,
    groundY: groundY,
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
    maxObstacleNum: 0,
    obstacleHeightMin: 1,
    obstacleHeightMax: 50,
    maxCloudNum: 25,
    cloudHeightMin: 100,
    cloudHeightMax: 150,
    maxRewardNum: 10,
    rewardHeightMax: 100,
    obstacle: "tree",
    toSpace: false,
    water: true,
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
            loadThreshold: 0.55,
            falling: 0,
            climbing: 0,
            spaceRewardHeight: 0,
            cloudPool: Array.from(Array(3), () => new Cloud(true)),
            rewardOrigin: new Turbine(true),
            obstacleOrigin: new Obstacle(true),
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
        for (const chunkLine of this.chunkLines) {
            chunkLine.chunks[0].showObstacles();
            chunkLine.chunks[0].showRewards();
        }


        this.waterGeometry = new THREE.PlaneGeometry(1500, 1000);
        this.water = new Water(
            this.waterGeometry,
            {
                textureWidth: 512,
                textureHeight: 512,
                waterNormals: new THREE.TextureLoader().load('', function(texture) {
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                }),
                alpha: 1.0,
                sunDirection: new THREE.Vector3(),
                sunColor: 0xffffff,
                waterColor: 0x001e0f,
                distortionScale: 3.7,
            }
        );
        this.water.position.z = -this.state.chunkWidth / 2;
        this.water.rotation.x = - Math.PI / 2;
        this.water.position.y = this.state.groundY + 1;
        this.add(this.water);
        this.waterUniforms = this.water.material.uniforms;
        this.water.visible = this.state.water;


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


        this.water.position.x = -this.position.x;
        this.water.position.y = this.state.groundY + 1;

        const chunkLine = this.getCurrentChunkLine();
        if (chunkLine.chunks[0].CMState.water && chunkLine.chunks[1].CMState.water) {
            this.water.position.z = -this.position.z - this.state.chunkWidth / 2;
        }
        else if (chunkLine.chunks[0].CMState.water) this.water.position.z = chunkLine.chunks[0].position.z;
        else if (chunkLine.chunks[1].CMState.water) this.water.position.z = chunkLine.chunks[1].position.z;
        else this.water.position.z = this.state.chunkWidth; // water is behind player and hence invisible



        for (const chunkLine of this.chunkLines) {
            for (const chunk of chunkLine.chunks) {
                for (const reward of chunk.rewards) if (reward.visible) reward.update(timeStamp);
                for (const cloud of chunk.clouds) cloud.update(timeStamp);
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
                const offset = speedLevel * Math.pow(120 - this.state.climbing, 0.3) / 2;
                this.state.climbing += offset;
                this.position.y -= offset;
            } else {
                this.state.climbing = 0;
            }
        }

        // show/hide obstacles as they enter the range of the player
        for (const chunkLine of this.chunkLines) {
            while (true) {
                const chunk = chunkLine.chunks[0];
                const currentReward = chunk.getCurrentReward();

                if (currentReward !== null && this.position.z + currentReward.position.z + chunk.position.z >= 0) chunk.hideCurrentReward();
                else break;
            }
            while (true) {
                const chunk = chunkLine.chunks[1];
                const nextReward = chunk.getNextReward();

                if (nextReward !== null && this.position.z + nextReward.position.z + chunk.position.z >= -this.state.chunkWidth) chunk.showNextReward();
                else break;
            }
            while (true) {
                const chunk = chunkLine.chunks[0];
                const currentObstacle = chunk.getCurrentObstacle();

                if (currentObstacle !== null && this.position.z + currentObstacle.position.z + chunk.position.z >= 0) chunk.hideCurrentObstacle();
                else break;
            }
            while (true) {
                const chunk = chunkLine.chunks[1];
                const nextObstacle = chunk.getNextObstacle();

                if (nextObstacle !== null && this.position.z + nextObstacle.position.z + chunk.position.z >= -this.state.chunkWidth) chunk.showNextObstacle();
                else break;
            }
        }

        // to keep the chunks in the vicinity of the player:
        // z-position is changed chunk-wise     (chunkLine.position.z = 0)
        // x-position is changed chunkLine-wise     (chunk.position.x = 0)

        // Move first chunk forward when player passes the chunk
        if (this.position.z - this.anchor.z >= this.state.chunkWidth) {
            for (const chunkLine of this.chunkLines) chunkLine.cycleChunks();

            if (this.state.toSpace) this.state.spaceRewardHeight += this.state.rewardHeightMax;

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

    resetBiome(biome) {
        if (biome === undefined) biome = { biome: "default" };
        this.updateBiome(biome);
        for (const chunkLine of this.chunkLines) {
            for (const chunk of chunkLine.chunks) {
                chunk.updateNoise(this.state);
            }
            chunkLine.chunks[0].showObstacles();
            chunkLine.chunks[0].showRewards();
        }
    }


    updateBiome(newBiome) {
        if (!newBiome.hasOwnProperty("biome")) {
            console.log("Unknown biome has no 'biome' property.");
            return;
        }
        newBiome = { ...default_biome, ...newBiome };
        for (const [name, value] of Object.entries(newBiome)) {
            if (modifiableFields.includes(name)) this.state[name] = value;
            else console.log("Attempting to change field " + name + ", which is unmodifiable/not a field.");
        }
    }

    getCurrentRewards() {
        return this.chunkLines.map(chunkLine => chunkLine.chunks[0].rewards[chunkLine.chunks[0].currentRewardIndex]);
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

    addActiveWater() {
        this.add(this.water)
    }

    updateWaterLevel() {
        this.water.position.y = this.state.waterHeight;
        this.updateTerrainGeo();
    }
}

export default ChunkManager;
