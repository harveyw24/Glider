import { Group, Color, PlaneBufferGeometry, VertexColors, PlaneGeometry, MeshStandardMaterial, MeshLambertMaterial, Mesh, Vector2 } from 'three';
import * as THREE from 'three';
import SimplexNoise from 'simplex-noise';
//import { Water } from 'three/examples/js/objects/Water.js';
import { Turbine } from '../Turbine';
import { Tree } from '../Tree';
import { Cloud } from '../Cloud';


function random(min, max) {
    return Math.random() * (max - min) + min;
}

class Chunk extends Group {

    constructor(parent, xOffset, yOffset, zOffset) {
        // Call parent Group() constructor
        super();
        this.setChunkPosition(xOffset, yOffset, zOffset);

        this.state = {
            gui: parent.state.gui,
            parent: parent,
            chunkManager: parent.state.chunkManager
        };

        // take state from parent.parent = chunkManager
        this.CMState = this.state.chunkManager.state; // abbreviation for chunkManager state
        this.chunk = parent; // abbreviation for this.state.parent

        // create the plane; -1 on vertWidth since argument is the number of segments
        this.geometry = new PlaneGeometry(this.CMState.chunkWidth, this.CMState.chunkWidth,
            this.CMState.chunkVertWidth - 1, this.CMState.chunkVertWidth - 1);
        this.geometry.verticesNeedUpdate = true;
        this.geometry.colorsNeedUpdate = true;


        this.trees = Array.from(Array(this.CMState.maxTreeNum), () => new Cloud());
        this.clouds = Array.from(Array(this.CMState.maxCloudNum), () => new Cloud());
        for (const tree of this.trees) {
            this.add(tree);
            tree.visible = false;
        }
        for (const cloud of this.clouds) {
            this.add(cloud);
            cloud.visible = false;
        }

        const terrain = new Mesh(this.geometry, new MeshLambertMaterial({
            // wireframe:true,
            vertexColors: VertexColors,
            flatShading: true, //required for flat shading
        }))
        this.add(terrain);

        // update location on the map
        terrain.position.y = this.CMState.groundY - 1;
        terrain.rotation.x = -Math.PI / 2;
        terrain.receiveShadow = true;


        this.heightMap = Array.from(Array(this.CMState.chunkVertWidth), () => Array(this.CMState.chunkVertWidth));
        this.updateNoise(); // get perline noise height map and update the geometry
        this.geometry.computeFlatVertexNormals(); //required for flat shading

        // Add self to parent's update list
        // parent.addToUpdateList(this);

    }

    setChunkPosition(x, y, z) {
        this.position.x = x;
        this.position.z = z;
        this.position.y = y;
    }

    update(timeStamp, x, y, z) {
        // update colors, "land breathing", etc
        /*console.log("update")
        var offset = this.CMState.breathOffset*Math.sin(timeStamp/(this.CMState.breathLength*1000));
        offset *= 10;
        console.log(offset)
        for(let i = 0; i < this.geometry.vertices.length; i++) {
          console.log("z = " + this.geometry.vertices[i].z);
          if(this.geometry.vertices[i] > this.CMState.waterHeight) {
            this.geometry.vertices[i].z = this.geometry.vertices[i].z + offset;
          }
        } */

        //console.log("TS = " + timeStamp + "(" + x + ", " + y + ", " + z + ")")
    }



    // i corresponds to z-axis
    // j corresponds to x-axis
    getVertexAtCoords(i, j) {
        const index = (i * (this.heightMap.length) + j);
        return this.geometry.vertices[index];
    }

    // returns the position of the vertex corresponding to this.heightMap[i][j]
    // relative to chunk.position
    getPositionAtCoords(i, j) {
        const v = this.getVertexAtCoords(i, j);
        return new THREE.Vector3(v.x, v.z + this.CMState.groundY, -v.y)
    }

    updateTerrainGeo() {
        //assign vert heights in geometry
        for (let j = 0; j < this.heightMap.length; j++) {
            for (let i = 0; i < this.heightMap[0].length; i++) {
                const v1 = this.getVertexAtCoords(i, j);
                v1.z = this.heightMap[i][j] * this.CMState.exaggeration * 10
                // set to water level if below water
                v1.z = Math.max(this.CMState.waterHeight, v1.z)
            }
        }

        //for every face calculate the color, do some gradient calculations to make it polygons
        this.geometry.faces.forEach(f => {
            //get three verts for the face
            const a = this.geometry.vertices[f.a]
            const b = this.geometry.vertices[f.b]
            const c = this.geometry.vertices[f.c]

            //assign colors based on the average point of the face
            var wiggle = this.CMState.colorWiggle * 25;
            const max = (a.z + b.z + c.z) / 3
            if (max <= this.CMState.waterHeight) {
                return f.color.setRGB((this.CMState.waterColor.r + Math.random() * wiggle) / 255,
                    (this.CMState.waterColor.g + Math.random() * wiggle) / 255,
                    (this.CMState.waterColor.b + Math.random() * wiggle) / 255)
                //     geometry2.faceVertexUvs[0].push([
                //     new THREE.Vector2(0,0),        //play with these values
                //     new THREE.Vector2(0.5,0),
                //     new THREE.Vector2(0.5,0.5)
                //
                // ]);
                // geometry2.uvsNeedUpdate = true;
            }
            if (max - this.CMState.waterHeight > this.CMState.exaggeration * 7) return f.color.setRGB((this.CMState.peakColor.r + Math.random() * wiggle) / 255, (this.CMState.peakColor.g + Math.random() * wiggle) / 255, (this.CMState.peakColor.b + Math.random() * wiggle) / 255)

            var ratio = (max - this.CMState.waterHeight) / (this.CMState.exaggeration * 7);

            // upper half? blend middle with peak
            if (ratio >= this.CMState.middleGradient) {
                ratio = (ratio - this.CMState.middleGradient) / this.CMState.middleGradient;
                return f.color.setRGB((this.CMState.peakColor.r * ratio + this.CMState.middleColor.r * (1 - ratio)
                    + Math.random() * wiggle) / 255,
                    (this.CMState.peakColor.g * ratio + this.CMState.middleColor.g * (1 - ratio) + Math.random() * wiggle) / 255,
                    (this.CMState.peakColor.b * ratio + this.CMState.middleColor.b * (1 - ratio) + Math.random() * wiggle) / 255);
            }

            ratio = (ratio) / this.CMState.middleGradient;
            return f.color.setRGB((this.CMState.middleColor.r * ratio + this.CMState.bankColor.r * (1 - ratio) + Math.random() * wiggle) / 255,
                (this.CMState.middleColor.g * ratio + this.CMState.bankColor.g * (1 - ratio) + Math.random() * wiggle) / 255,
                (this.CMState.middleColor.b * ratio + this.CMState.bankColor.b * (1 - ratio) + Math.random() * wiggle) / 255);

        })

        this.geometry.verticesNeedUpdate = true;
        this.geometry.colorsNeedUpdate = true;
        this.geometry.computeFlatVertexNormals();
    }

    updateObstacles() {
        let treeIndex = 0;
        let cloudIndex = 0;

        for (let i = 0; i < this.heightMap.length; i++) {
            for (let j = 0; j < this.heightMap[0].length; j++) {
                const v = this.getVertexAtCoords(i, j);
                const pos = this.getPositionAtCoords(i, j);
                const h = this.heightMap[i][j];
                if (treeIndex < this.trees.length && this.CMState.treeHeightMin < v.z && v.z < this.CMState.treeHeightMax && Math.random() < .05 / (1 + Math.exp(h - .5))) {
                    this.trees[treeIndex].visible = true;
                    this.trees[treeIndex].position.set(pos.x, pos.y, pos.z); // plane is rotated
                    treeIndex++;
                }
                if (cloudIndex < this.clouds.length && Math.random() < 25 / this.geometry.vertices.length) {
                    this.clouds[cloudIndex].visible = true;
                    this.clouds[cloudIndex].position.set(v.x, random(this.CMState.cloudYMin, this.CMState.cloudYMax), -v.y);
                    cloudIndex++;
                }
            }
        }
        // want a hit rate that is close to 1.0 but not always 1.0
        console.log(
            "tree hit rate:", this.CMState.maxTreeNum != 0 ? treeIndex / this.CMState.maxTreeNum : "(maxTreeNum is 0); ",
            "cloud hit rate:", this.CMState.maxCloudNum != 0 ? cloudIndex / this.CMState.maxCloudNum : "(maxCloudNum is 0)"
        );
        for (let i = treeIndex; i < this.trees.length; i++) this.trees[i].visible = false;
        for (let i = cloudIndex; i < this.clouds.length; i++) this.clouds[i].visible = false;
    }

    updateNoise() {
        this.updateHeightMap();
        this.updateTerrainGeo();
        this.updateObstacles();
    }

    // from https://medium.com/@joshmarinacci/low-poly-style-terrain-generation-8a017ab02e7b
    noise(nx, ny, simplex) {
        // Is in range -1.0:+1.0
        return simplex.noise2D(nx, ny);
    }
    //stack some noisefields together
    octave(nx, ny, octaves, simplex) {
        let val = 0;
        let freq = this.CMState.freq;
        let max = 0;
        let amp = 1; //this.CMState.amplitude;
        for (let i = 0; i < octaves; i++) {
            val += this.noise(nx * freq, ny * freq, simplex) * amp;
            max += amp;
            amp /= 2;
            freq *= 2;
        }
        return val / max;
    }

    //generate noise
    updateHeightMap() {
        // make 2d array
        var simplex = new SimplexNoise(this.CMState.randSeed);



        for (let i = 0; i < this.heightMap.length; i++) {
            for (let j = 0; j < this.heightMap[0].length; j++) {
                let h = this.octave(
                    (i + (this.position.z + this.chunk.position.z) / this.CMState.chunkWidth * (this.CMState.chunkVertWidth - 1)) / this.CMState.chunkVertWidth,
                    (j + (this.position.x + this.chunk.position.x) / this.CMState.chunkWidth * (this.CMState.chunkVertWidth - 1)) / this.CMState.chunkVertWidth,
                    this.CMState.octaves, simplex);
                this.heightMap[i][j] = h;
            }
        }

    }

}

export default Chunk;
