import { Group, Color, PlaneBufferGeometry, PlaneGeometry } from 'three';
import { Chunk } from '../Chunk';

// SET THESE TO CHANGE CHUNK DIMENSIONS
const startYBelow = 200;
const chunkPxWidth = 1000;
const chunkVertexWidth = 100;

class ChunkManager extends Group {
    constructor(parent) {
        
        super();

        this.state = {
            gui: parent.state.gui,
            parent: parent,
            chunks: [],
            chunkWidth: chunkPxWidth,
            chunkVertWidth: chunkVertexWidth,
            simplex: {},
            totalVertWidth: chunkVertexWidth*3, // chunkVertWidth * 3
            currentXOffset: 0,
            currentZOffset: 0,
            breathOffset: 5,
            breathLength: 5,
            octaves: 16,
            // amplitude: 1, // Does nothing
            exaggeration: 60,
            waterLevel: 0,
            waterColor: new Color(50, 90, 145),
            bankColor: new Color(0, 255, 0),
            middleColor: new Color(255, 0, 0),
            peakColor: new Color(0, 0, 255),
            colorWiggle: 0.1,
            middleGradient: 0.5,
            randSeed: 4,
            freq: 1,
            currentOffset: 0,
        }
        

        // this.state.simplex = new SimplexNoise(this.state.randSeed);

        const coordinates = [
          [0, 0, this.state.chunkWidth],
          [0, 0, 0],
          [0, 0, -this.state.chunkWidth]
        ]

        for (let i = 0; i < coordinates.length; i++) {
            let new_plane_geo = new PlaneGeometry(this.state.chunkWidth, this.state.chunkWidth,
                                        this.state.chunkVertWidth - 1, this.state.chunkVertWidth - 1);
            const new_chunk = new Chunk(this, coordinates[i][0], coordinates[i][1], coordinates[i][2], new_plane_geo); 
            this.add(new_chunk);
            this.state.chunks.push(new_chunk);
          }

        parent.addToUpdateList(this);

        // this.chunks = [];

        // const plane_geometry = new PlaneGeometry(200, 200, 20, 20);

        // this.chunks.push(new Chunk(parent, 0, 0, 0, plane_geometry));
        // this.add(this.chunks[0].terrain);


        // Populate GUI
        var folder1 = this.state.gui.addFolder( 'BREATH' );
        folder1.add(this.state, 'breathLength', 0, 20);
        folder1.add(this.state, 'breathOffset', 0, 100);

        // Related to perlin noise, so call updateNoise which updates everything
        var folder0 = this.state.gui.addFolder( 'TERRAIN GENERATION FACTORS' );
        folder0.add(this.state, 'octaves', 1, 16).name("Jaggedness").onChange(() => this.updateNoise()) ;
        // folder0.add(this.state, 'amplitude', 0, 10).onChange(() => this.updateNoise());
        folder0.add(this.state, 'freq', 1, 10).name("Peaks").onChange(() => this.updateNoise());
        folder0.add(this.state, 'randSeed', 0, 10).name("World Seed").onChange(() => this.updateSimplexSeed());

        // Related to the look of the terrain and don't need to recalculate height map again
        var folder = this.state.gui.addFolder( 'TERRAIN LOOK FACTORS' );
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

    updateTerrainGeo() {
        for (let chunk of this.state.chunks) {
            chunk.updateTerrainGeo();
        }
    }

    update(timeStamp) {
        for (let chunk of this.state.chunks) {
            chunk.position.y += 0.01;
            chunk.position.z += 0.2;
        }
    }
}
export default ChunkManager;