import { Group, VertexColors, PlaneGeometry, MeshLambertMaterial, Mesh } from 'three';
import * as THREE from 'three';
import SimplexNoise from 'simplex-noise';


const obstaclesLength = 25; // maximum number of obstacles supported per chunk
const rewardsLength = 15; // maximum number of obstacles supported per chunk

function random(min, max) { return Math.random() * (max - min) + min; }

// smoothly transition from 0 to 1.0 as x goes from -infty to +infty
function transition(x, rate) {
    return 1 / (1 + Math.exp(-x * rate));
}

function sinStep(x, transitionRange, width) {
    if (x < transitionRange) {
        return (Math.sin((x - transitionRange / 2) / transitionRange * Math.PI) + 1) / 2;
    } else if (x > width - transitionRange) {
        return (-Math.sin((width - x + transitionRange / 2) / transitionRange * Math.PI) + 1) / 2;
    } else {
        return 1;
    }
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


        this.activeObstacleNum = 0;
        this.currentObstacleIndex = 0;
        this.nextObstacleIndex = 0;
        this.obstacles = Array(obstaclesLength);
        for (let i = 0; i < obstaclesLength; i++) {
            const obstacle = this.CMState.obstacleOrigin.clone();
            obstacle.setObstacle(this.CMState.obstacle);
            obstacle.matrixAutoUpdate = false;
            this.obstacles[i] = obstacle;
        }

        this.currentRewardIndex = 0;
        this.nextRewardIndex = 0;
        this.rewards = Array(rewardsLength);
        for (let i = 0; i < rewardsLength; i++) {
            this.rewards[i] = this.CMState.rewardOrigin.clone();
        }

        this.clouds = Array(this.CMState.maxCloudNum);
        for (let i = 0; i < this.CMState.maxCloudNum; i++) {
            this.clouds[i] = this.CMState.cloudPool[Math.floor(this.CMState.cloudPool.length * Math.random())].clone();
        }

        this.terrain = new Mesh(this.geometry, new MeshLambertMaterial({
            // wireframe:true,
            vertexColors: VertexColors,
            flatShading: true, //required for flat shading
        }))
        this.add(this.terrain);

        // update location on the map
        this.terrain.position.y = this.CMState.groundY - 1;
        this.terrain.rotation.x = -Math.PI / 2;
        this.terrain.receiveShadow = true;

        this.heightMap = Array.from(Array(this.CMState.chunkVertWidth), () => Array(this.CMState.chunkVertWidth));
        this.updateNoise(); // get perline noise height map and update the geometry
        this.geometry.computeFlatVertexNormals(); //required for flat shading

    }

    setChunkPosition(x, y, z) {
        this.position.x = x;
        this.position.z = z;
        this.position.y = y;
    }

    update(timeStamp, x, y, z) {

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

    updateObstaclesRewards() {
        let obstacleIndex = 0;
        let cloudIndex = 0;

        let totalProb = 0;
        for (let i = 0; i < this.heightMap.length; i++) {
            for (let j = 0; j < this.heightMap[0].length; j++) {
                const v = this.getVertexAtCoords(i, j);
                const h = this.heightMap[i][j];
                if (this.CMState.obstacleHeightMin <= v.z && v.z <= this.CMState.obstacleHeightMax) totalProb += 1 / (1 + Math.exp(h - .5));
            }
        }

        for (let i = this.heightMap.length - 1; i >= 0; i--) { // iterate along -z axis (i.e. into the screen)
            for (let j = 0; j < this.heightMap[0].length; j++) {
                const v = this.getVertexAtCoords(i, j);
                const pos = this.getPositionAtCoords(i, j);
                const h = this.heightMap[i][j];
                if (obstacleIndex < this.CMState.maxObstacleNum
                    && this.CMState.obstacleHeightMin <= v.z && v.z <= this.CMState.obstacleHeightMax
                    && Math.random() < (this.CMState.maxObstacleNum / totalProb) * 1 / (1 + Math.exp(h - .5))
                ) {
                    if (this.CMState.obstacle != "cloud") {
                        this.obstacles[obstacleIndex].rotation.y = Math.random() * Math.PI * 2;
                    }
                    this.obstacles[obstacleIndex].position.set(pos.x, pos.y, pos.z); // plane is rotated
                    this.obstacles[obstacleIndex].updateMatrix();
                    // this.obstacles[obstacleIndex].position.set(-this.state.parent.position.x * .9, -50, pos.z); // plane is rotated
                    obstacleIndex++;
                }
                if (cloudIndex < this.clouds.length && Math.random() < 25 / this.geometry.vertices.length) {
                    this.add(this.clouds[cloudIndex]);
                    this.clouds[cloudIndex].position.set(v.x, random(this.CMState.cloudHeightMin, this.CMState.cloudHeightMax) + this.CMState.groundY, -v.y);
                    cloudIndex++;
                }
            }
        }

        // want a hit rate that is close to 1.0 but not always 1.0
        this.activeObstacleNum = obstacleIndex;
        this.activeCloudNum = cloudIndex;
        for (let i = cloudIndex; i < this.clouds.length; i++) this.remove(this.clouds[i]);


        for (let rewardIndex = 0; rewardIndex < this.CMState.maxRewardNum; rewardIndex++) {
            const iCoord = Math.floor(this.CMState.chunkVertWidth * (this.CMState.maxRewardNum - rewardIndex - 1) / this.CMState.maxRewardNum);
            if (this.CMState.toSpace) {
                const pos = this.getPositionAtCoords(iCoord, 0);
                this.rewards[rewardIndex].position.set(
                    0,
                    this.state.chunkManager.state.spaceRewardHeight + this.CMState.groundY + rewardIndex * this.CMState.rewardHeightMax / this.CMState.maxRewardNum,
                    pos.z
                );
            } else {
                let pos;
                for (let i = 0; i < 10; i++) {
                    pos = this.getPositionAtCoords(iCoord, Math.floor(random(0, this.CMState.chunkVertWidth - 1)));
                    if (pos.y <= this.CMState.rewardHeightMax + this.CMState.groundY) break;
                    if (i == 9) console.log("couldn't find a good spot!");
                }

                this.rewards[rewardIndex].position.set(pos.x, random(pos.y, this.CMState.rewardHeightMax + this.CMState.groundY), pos.z);
            }
        }

        console.log(this.activeCloudNum);

        this.hideRewards();
        this.hideObstacles();
    }



    showRewards() {
        for (let i = 0; i < this.CMState.maxRewardNum; i++) this.add(this.rewards[i]);
        this.currentRewardIndex = 0;
        this.nextRewardIndex = this.CMState.maxRewardNum;
    }
    hideRewards() {
        for (const reward of this.rewards) this.remove(reward);
        this.currentRewardIndex = 0;
        this.nextRewardIndex = 0;
    }
    // get first visible reward
    getCurrentReward() {
        if (0 <= this.currentRewardIndex && this.currentRewardIndex < this.CMState.maxRewardNum) {
            return this.rewards[this.currentRewardIndex];
        } else return null;
    }
    // get next invisible reward
    getNextReward() {
        if (0 <= this.nextRewardIndex && this.nextRewardIndex < this.CMState.maxRewardNum) {
            return this.rewards[this.nextRewardIndex];
        } else return null;
    }
    hideCurrentReward() {
        const currentReward = this.getCurrentReward();
        if (currentReward !== null) {
            this.remove(currentReward);
            this.currentRewardIndex++;
        }
    }
    showNextReward() {
        const nextReward = this.getNextReward();
        if (nextReward !== null) {
            this.add(nextReward);
            this.nextRewardIndex++;
        }
    }



    showObstacles() {
        for (let i = 0; i < this.activeObstacleNum; i++) this.add(this.obstacles[i]);
        this.currentObstacleIndex = 0;
        this.nextObstacleIndex = this.activeObstacleNum;
    }
    hideObstacles() {
        for (const obstacle of this.obstacles) this.remove(obstacle);
        this.currentObstacleIndex = 0;
        this.nextObstacleIndex = 0;
    }
    // get first visible obstacle
    getCurrentObstacle() {
        if (0 <= this.currentObstacleIndex && this.currentObstacleIndex < this.activeObstacleNum) {
            return this.obstacles[this.currentObstacleIndex];
        } else return null;
    }
    // get next invisible obstacle
    getNextObstacle() {
        if (0 <= this.nextObstacleIndex && this.nextObstacleIndex < this.activeObstacleNum) {
            return this.obstacles[this.nextObstacleIndex];
        } else return null;
    }
    hideCurrentObstacle() {
        const currentObstacle = this.getCurrentObstacle();
        if (currentObstacle !== null) {
            this.remove(currentObstacle);
            this.currentObstacleIndex++;
        }
    }
    showNextObstacle() {
        const nextObstacle = this.getNextObstacle();
        if (nextObstacle !== null) {
            this.add(nextObstacle);
            this.nextObstacleIndex++;
        }
    }

    updateNoise(CMState) {
        if (CMState !== undefined) {
            if (this.CMState.obstacle !== CMState.obstacle) {
                for (const obstacle of this.obstacles) obstacle.setObstacle(CMState.obstacle);
            }
            this.CMState = { ...CMState };
            this.terrain.position.y = this.CMState.groundY - 1;
        }
        if (this.CMState.maxObstacleNum > obstaclesLength) {
            console.log("Provided maxObstacleNum (" + this.CMState.maxObstacleNum + ") is too large! Max is " + obstaclesLength);
            this.CMState.maxObstacleNum = obstaclesLength;
            console.log("Provided maxRewardNum (" + this.CMState.maxRewardNum + ") is too large! Max is " + rewardsLength);
        } else if (this.CMState.maxRewardNum > rewardsLength) {
            this.CMState.maxRewardNum = rewardsLength;
        }
        this.updateHeightMap();
        this.updateTerrainGeo();
        this.updateObstaclesRewards();
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
