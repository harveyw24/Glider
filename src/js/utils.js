import * as THREE from 'three';


// inspired by https://stackoverflow.com/questions/56680582/how-can-i-get-the-geometry-from-a-gltf-object
export function findType(object, type, arr) {
    object.children.forEach((child) => {
        if (child.type === type) {
            arr.push(child)
        }
        findType(child, type, arr);
    });
}


export function generateBiomes() {
    const default_biome = {biome: "default"}
    const desert_biome = {
        biome: "desert",
        waterColor: new THREE.Color(97, 32, 13),
        bankColor: new THREE.Color(97, 32, 13),
        middleColor: new THREE.Color(232, 161, 90),
        peakColor: new THREE.Color(252, 203, 78),
        exaggeration: 10,
        freq: 4,
        maxObstacleNum: 10,
        obstacle: "cactus",
    }
    const volcano_biome = {
        biome: "volcano",
        waterColor: new THREE.Color(100, 0, 0),
        bankColor: new THREE.Color(0, 0, 0),
        middleColor: new THREE.Color(0, 0, 0),
        peakColor: new THREE.Color(242, 64, 24),
        exaggeration: 27,
        freq: 3,
        maxObstacleNum: 0,
    }
    const grassland_biome = {
        biome: "grassland",
        waterColor: new THREE.Color(0, 127, 255),
        bankColor: new THREE.Color(34, 139, 34),
        middleColor: new THREE.Color(154, 205, 50),
        peakColor: new THREE.Color(223, 255, 0),
        exaggeration: 15,
        freq: 1,
        maxObstacleNum: 15,
        obstacle: "sheep",
    }
    const arctic_biome = {
        biome: "arctic",
        waterColor: new THREE.Color(1, 12, 48),
        bankColor: new THREE.Color(39, 168, 247),
        middleColor: new THREE.Color(152, 212, 255),
        peakColor: new THREE.Color(209, 225, 255),
        exaggeration: 40,
        freq: 2,
        maxObstacleNum: 15,
        rewardHeightMax: 180,
        obstacle: "penguin",
        obstacleHeightMax: 3,
        obstacleHeightMin: 0,
        maxRewardNum: 15,
    }
    const stone_biome = {
        biome: "stone",
        waterColor: new THREE.Color(5, 78, 5),
        bankColor: new THREE.Color(54, 82, 54),
        middleColor: new THREE.Color(223, 175, 115),
        peakColor: new THREE.Color(55, 46, 29),
        exaggeration: 30,
        freq: 8,
        octaves: 1,
        colorWiggle: -1,
        middleGradient: .8,
        gamma: 5,
        smoothPeaks: true,
        rewardHeightMax: 50,
        maxObstacleNum: 25,
        obstacle: "tree",
    }
    const space_biome = {
        biome: "space",
        waterColor: new THREE.Color(0, 0, 0),
        bankColor: new THREE.Color(0, 0, 0),
        middleColor: new THREE.Color(0, 0, 0),
        peakColor: new THREE.Color(0, 0, 0),
        exaggeration: 0,
        toSpace: true,
        maxObstacleNum: 0,
        rewardHeightMax: 15,
    }
    return [default_biome, desert_biome, volcano_biome, grassland_biome, arctic_biome, stone_biome];
}

export const space_biome = {
    biome: "space",
    waterColor: new THREE.Color(0, 0, 0),
    bankColor: new THREE.Color(0, 0, 0),
    middleColor: new THREE.Color(0, 0, 0),
    peakColor: new THREE.Color(0, 0, 0),
    exaggeration: 0,
    toSpace: true,
    maxObstacleNum: 0,
    rewardHeightMax: 15,
}