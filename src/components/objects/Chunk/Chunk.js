import { Group, Color, PlaneBufferGeometry, VertexColors, PlaneGeometry, MeshStandardMaterial, MeshLambertMaterial, Mesh, Vector2 } from 'three';
import * as THREE from 'three';
import SimplexNoise from 'simplex-noise';
//import { Water } from 'three/examples/js/objects/Water.js';
import { Tree } from '../Tree';
import { Turbine } from '../Turbine';
import { Cloud } from '../Cloud';
import { Obstacle } from '../Obstacle';


function random(min, max) { return Math.random() * (max - min) + min; }


// smoothly transition from 0 to 1.0 as x goes from -infty to +infty
function transition(x, rate) {
    return 1 / (1 + Math.exp(-x * rate));
}

const treesLength = 50; // maximum number of trees supported per chunk


function sinStep(x, transitionRange, width) {
    if (x < transitionRange) {
        return (Math.sin((x - transitionRange / 2) / transitionRange * Math.PI) + 1) / 2;
    } else if (x > width - transitionRange) {
        return (-Math.sin((width - x + transitionRange / 2) / transitionRange * Math.PI) + 1) / 2;
    } else {
        return 1;
    }
}

function zeroBoxStep(x, y, transitionRange, width) {
    let result = 1;
    if (x < transitionRange) {
        result *= (Math.sin((x - transitionRange / 2) / transitionRange * Math.PI) + 1) / 2;
    } else if (x > width - transitionRange) {
        result *= (-Math.sin((width - x + transitionRange / 2) / transitionRange * Math.PI) + 1) / 2;
    }
    if (y < transitionRange) {
        result *= (Math.sin((y - transitionRange / 2) / transitionRange * Math.PI) + 1) / 2;
    } else if (y > width - transitionRange) {
        result *= (-Math.sin((width - y + transitionRange / 2) / transitionRange * Math.PI) + 1) / 2;
    }
    return result;
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
        this.CMState = { ...this.state.chunkManager.state }; // snapshots chunkManager.state
        this.chunkLine = parent; // abbreviation for this.state.parent

        // create the plane; -1 on vertWidth since argument is the number of segments
        this.geometry = new PlaneGeometry(this.CMState.chunkWidth, this.CMState.chunkWidth,
            this.CMState.chunkVertWidth - 1, this.CMState.chunkVertWidth - 1);
        this.geometry.verticesNeedUpdate = true;
        this.geometry.colorsNeedUpdate = true;


        this.activeTreeNum = 0;
        this.currentTreeIndex = 0;
        this.nextTreeIndex = 0;


        this.trees = Array.from(Array(treesLength));
        const tree0 = new Obstacle(true);
        for (let i = 0; i < treesLength; i++) {
            const tree = i == 0 ? tree0 : tree0.clone();
            tree.setObstacle(this.CMState.obstacle);
            tree.visible = false;
            tree.matrixAutoUpdate = false;
            this.add(tree);
            this.trees[i] = tree;
        }

        console.log(Object.is(tree0.material, tree0.clone().material));
        console.log(this.trees);

        this.clouds = Array.from(Array(this.CMState.maxCloudNum), () => new Cloud());
        for (const cloud of this.clouds) {
            cloud.visible = false;
            this.add(cloud);
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



    // i corresponds to +z-axis
    // j corresponds to +x-axis
    getVertexAtCoords(i, j) {
        const index = (i * (this.CMState.chunkVertWidth) + j);
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

        let totalProb = 0;
        for (let i = 0; i < this.heightMap.length; i++) {
            for (let j = 0; j < this.heightMap[0].length; j++) {
                const v = this.getVertexAtCoords(i, j);
                const h = this.heightMap[i][j];
                if (this.CMState.treeHeightMin <= v.z && v.z <= this.CMState.treeHeightMax) totalProb += 1 / (1 + Math.exp(h - .5));
            }
        }

        for (let i = this.heightMap.length - 1; i >= 0; i--) { // iterate along -z axis (i.e. into the screen)
            for (let j = 0; j < this.heightMap[0].length; j++) {
                const v = this.getVertexAtCoords(i, j);
                const pos = this.getPositionAtCoords(i, j);
                const h = this.heightMap[i][j];
                if (treeIndex < this.CMState.maxTreeNum
                    && this.CMState.treeHeightMin <= v.z && v.z <= this.CMState.treeHeightMax
                    && Math.random() < (this.CMState.maxTreeNum / totalProb) * 1 / (1 + Math.exp(h - .5))
                ) {
                    this.trees[treeIndex].position.set(pos.x, pos.y, pos.z); // plane is rotated
                    if (this.CMState.obstacle != "cloud") {
                        this.trees[treeIndex].rotation.y = Math.random() * Math.PI * 2;
                    }
                    this.trees[treeIndex].updateMatrix();
                    // this.trees[treeIndex].position.set(-this.state.parent.position.x * .9, -50, pos.z); // plane is rotated
                    treeIndex++;
                }
                if (cloudIndex < this.clouds.length && Math.random() < 25 / this.geometry.vertices.length) {
                    this.clouds[cloudIndex].visible = true;
                    this.clouds[cloudIndex].position.set(v.x, random(this.CMState.cloudHeightMin, this.CMState.cloudHeightMax) + this.CMState.groundY, -v.y);
                    cloudIndex++;
                }
            }
        }
        // want a hit rate that is close to 1.0 but not always 1.0
        // console.log(
        //     "tree hit rate:", this.CMState.maxTreeNum != 0 ? treeIndex / this.CMState.maxTreeNum : "(maxTreeNum is 0); ",
        //     "cloud hit rate:", this.CMState.maxCloudNum != 0 ? cloudIndex / this.CMState.maxCloudNum : "(maxCloudNum is 0)"
        // );
        this.activeTreeNum = treeIndex;
        this.activeCloudNum = cloudIndex;
        for (let i = cloudIndex; i < this.clouds.length; i++) this.clouds[i].visible = false;
    }

    showTrees() {
        for (let i = 0; i < this.activeTreeNum; i++) this.trees[i].visible = true;
        this.currentTreeIndex = 0;
        this.nextTreeIndex = this.activeTreeNum;
    }

    hideTrees() {
        for (const tree of this.trees) tree.visible = false;
        this.currentTreeIndex = 0;
        this.nextTreeIndex = 0;
    }

    // get first visible tree
    getCurrentTree() {
        if (0 <= this.currentTreeIndex && this.currentTreeIndex < this.activeTreeNum) {
            return this.trees[this.currentTreeIndex];
        } else return null;
    }

    // get next invisible tree
    getNextTree() {
        if (0 <= this.nextTreeIndex && this.nextTreeIndex < this.activeTreeNum) {
            return this.trees[this.nextTreeIndex];
        } else return null;
    }

    hideCurrentTree() {
        const currentTree = this.getCurrentTree();
        if (currentTree !== null) {
            currentTree.visible = false;
            this.currentTreeIndex++;
        }
    }

    showNextTree() {
        const nextTree = this.getNextTree();
        if (nextTree !== null) {
            nextTree.visible = true;
            this.nextTreeIndex++;
        }
    }

    updateNoise(CMState) {
        if (CMState !== undefined) {
            console.log("using obstacle: ", CMState.obstacle);
            if (this.CMState.obstacle !== CMState.obstacle) {
                for (const tree of this.trees) tree.setObstacle(CMState.obstacle);
            }
            this.CMState = { ...CMState };
        }
        if (this.CMState.maxTreeNum > treesLength) {
            console.log("Provided maxTreeNum (" + this.CMState.maxTreeNum + ") is too large! Max is " + treesLength);
            this.CMState.maxTreeNum = treesLength;
        }
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
                    (i + (this.position.z + this.chunkLine.position.z) / this.CMState.chunkWidth * (this.CMState.chunkVertWidth - 1)) / this.CMState.chunkVertWidth,
                    (j + (this.position.x + this.chunkLine.position.x) / this.CMState.chunkWidth * (this.CMState.chunkVertWidth - 1)) / this.CMState.chunkVertWidth,
                    this.CMState.octaves, simplex);
                h *= sinStep(i, 5, this.CMState.chunkVertWidth - 1);
                if (this.CMState.gamma !== 0) h *= transition(h - this.CMState.middleGradient, this.CMState.gamma);
                this.heightMap[i][j] = h;
            }
        }

        if (this.CMState.smoothPeaks) {
            for (let i = 2; i < this.heightMap.length - 2; i++) {
                for (let j = 2; j < this.heightMap[0].length - 2; j++) {
                    const neighborhoodMax = Math.max(
                        this.heightMap[i - 1][j - 1], this.heightMap[i][j - 1], this.heightMap[i + 1][j - 1],
                        this.heightMap[i - 1][j], this.heightMap[i][j], this.heightMap[i + 1][j],
                        this.heightMap[i - 1][j + 1], this.heightMap[i][j + 1], this.heightMap[i + 1][j + 1],
                    );
                    if (this.heightMap[i][j] == neighborhoodMax) {
                        const average = (
                            this.heightMap[i - 1][j - 1] + this.heightMap[i][j - 1] + this.heightMap[i + 1][j - 1] +
                            this.heightMap[i - 1][j] + this.heightMap[i][j] + this.heightMap[i + 1][j] +
                            this.heightMap[i - 1][j + 1] + this.heightMap[i][j + 1] + this.heightMap[i + 1][j + 1]
                        ) / 8;
                        for (const di of [-1, 0, 1]) {
                            for (const dj of [-1, 0, 1]) {
                                this.heightMap[i + di][j + dj] = (this.heightMap[i + di][j + dj] + average) / 2;
                            }
                        }
                        this.heightMap[i][j] = (this.heightMap[i][j] + average) / 2;
                    }
                }
            }
        }

    }

}

export default Chunk;
