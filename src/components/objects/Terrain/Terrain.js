import { Group, Color, PlaneBufferGeometry, VertexColors, PlaneGeometry, MeshStandardMaterial, MeshLambertMaterial, Mesh, Vector2 } from 'three';
import SimplexNoise from 'simplex-noise';
//import { Water } from 'three/examples/js/objects/Water.js';
import { Tree } from '../Tree';
import { Cloud } from '../Cloud';


function random(min, max) {
    return Math.random() * (max - min) + min;
}

class Terrain extends Group {

    constructor(parent) {
        // Call parent Group() constructor
        super();

        this.state = {
            gui: parent.state.gui,
            parent: parent,
            chunkManager: parent.state.parent
        };

        // take state from parent.parent = chunkManager
        this.CMState = this.state.chunkManager.state; // abbreviation for chunkManager state
        this.chunk = parent; // abbreviation for this.state.parent

        // create the plane; -1 on vertWidth since argument is the number of segments
        this.geometry = new PlaneGeometry(this.CMState.chunkWidth, this.CMState.chunkWidth,
            this.CMState.chunkVertWidth - 1, this.CMState.chunkVertWidth - 1);
        this.geometry.verticesNeedUpdate = true;
        this.geometry.colorsNeedUpdate = true;


        this.trees = Array.from(Array(this.CMState.maxTreeNum), () => new Tree());
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

    update(timeStamp, x, y, z) {
        // update colors, "land breathing", etc
        /*console.log("update")
        var offset = this.CMState.breathOffset*Math.sin(timeStamp/(this.CMState.breathLength*1000));
        offset *= 10;
        console.log(offset)
        for(let i = 0; i < this.geometry.vertices.length; i++) {
          console.log("z = " + this.geometry.vertices[i].z);
          if(this.geometry.vertices[i] > this.CMState.waterLevel) {
            this.geometry.vertices[i].z = this.geometry.vertices[i].z + offset;
          }
        } */

        //console.log("TS = " + timeStamp + "(" + x + ", " + y + ", " + z + ")")
    }

    updateTerrainGeo() {
        //assign vert heights in geometry
        for (let j = 0; j < this.heightMap.length; j++) {
            for (let i = 0; i < this.heightMap[0].length; i++) {
                const index = (j * (this.heightMap.length) + i)
                const v1 = this.geometry.vertices[index]
                v1.z = this.heightMap[j][i] * this.CMState.exaggeration * 10
                // set to water level if below water
                v1.z = Math.max(this.CMState.waterLevel, v1.z)
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
            if (max <= this.CMState.waterLevel) {
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
            if (max - this.CMState.waterLevel > this.CMState.exaggeration * 7) return f.color.setRGB((this.CMState.peakColor.r + Math.random() * wiggle) / 255, (this.CMState.peakColor.g + Math.random() * wiggle) / 255, (this.CMState.peakColor.b + Math.random() * wiggle) / 255)

            var ratio = (max - this.CMState.waterLevel) / (this.CMState.exaggeration * 7);

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
                const index = (j * (this.heightMap.length) + i);
                const v = this.geometry.vertices[index];
                if (treeIndex < this.trees.length && this.CMState.treeHeightMin < v.z && v.z < this.CMState.treeHeightMax && Math.random() < .03) {
                    this.trees[treeIndex].visible = true;
                    this.trees[treeIndex].position.set(v.x, v.z + this.CMState.groundY, -v.y); // plane is rotated
                    treeIndex++;
                } else if (cloudIndex < this.clouds.length && Math.random() < .005) {
                    this.clouds[cloudIndex].visible = true;
                    this.clouds[cloudIndex].position.set(v.x, random(this.CMState.cloudYMin, this.CMState.cloudYMax), -v.y);
                    cloudIndex++;
                }
            }
        }
        console.log("trees & clouds: ", treeIndex, cloudIndex);
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
                let v = this.octave(
                    j / this.CMState.chunkVertWidth,
                    (i + this.chunk.position.z / this.CMState.chunkWidth * (this.CMState.chunkVertWidth - 1)) / this.CMState.chunkVertWidth,
                    this.CMState.octaves, simplex);
                this.heightMap[i][j] = v;
            }
        }

    }

}

export default Terrain;
