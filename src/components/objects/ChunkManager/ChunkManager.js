import { Group, Color, PlaneBufferGeometry, PlaneGeometry } from 'three';
import { Chunk } from '../Chunk';

// SET THESE TO CHANGE CHUNK DIMENSIONS
const startYBelow = 200;
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
            currentXOffset: 0,
            currentZOffset: 0,
            breathOffset: 5,
            breathLength: 5,
            octaves: 3,
            // amplitude: 1, // Does nothing
            exaggeration: 17,
            waterLevel: 0,
            waterColor: new Color(50, 90, 145),
            bankColor: new Color(26, 143, 26),
            middleColor: new Color(113, 105, 105),
            peakColor: new Color(255, 255, 255),
            colorWiggle: 0.1,
            middleGradient: 0.5,
            randSeed: 3.8,
            freq: 4.4,
            currentOffset: 0,
            maxTreeNum: 100,
            treeHeightMin: 0,
        }


        // this.state.simplex = new SimplexNoise(this.state.randSeed);

        this.anchor = this.position.clone();
        const coordinates = [
            [0, 0, 0],
            [0, 0, -this.state.chunkWidth],
            [0, 0, -2 * this.state.chunkWidth],
            [0, 0, -3 * this.state.chunkWidth]
        ];


        this.chunks = [];
        for (let i = 0; i < coordinates.length; i++) {
            const new_chunk = new Chunk(this, coordinates[i][0], coordinates[i][1], coordinates[i][2]);
            this.add(new_chunk);
            this.chunks.push(new_chunk);
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
        folder.add(this.state, 'waterLevel', -100, 100).name("Water Level").onChange(() => this.updateTerrainGeo());
        folder.add(this.state, 'colorWiggle', -1, 1).name("Color Texturing").onChange(() => this.updateTerrainGeo());
        folder.add(this.state, 'middleGradient', 0, 1).name("Peak Height").onChange(() => this.updateTerrainGeo());
        folder.addColor(this.state, 'waterColor').name("Water Color").onChange(() => this.updateTerrainGeo());
        folder.addColor(this.state, 'bankColor').name("Bank Color").onChange(() => this.updateTerrainGeo());
        folder.addColor(this.state, 'middleColor').name("Middle Color").onChange(() => this.updateTerrainGeo());
        folder.addColor(this.state, 'peakColor').name("Peak Color").onChange(() => this.updateTerrainGeo());

        folder.open();

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
        this.position.z += 5;
        this.position.y += 0.01;
        if (this.position.z - this.anchor.z >= this.state.chunkWidth) {
            this.chunks[0].setChunkPosition(
                this.chunks[0].position.x,
                this.chunks[0].position.y,
                this.chunks[this.chunks.length - 1].position.z - this.state.chunkWidth
            );
            this.chunks[0].updateNoise();
            this.chunks.push(this.chunks.shift());

            this.anchor.z = this.position.z;
        }
    }
}

export default ChunkManager;
