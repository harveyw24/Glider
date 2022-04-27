import { Group, SphereGeometry, MeshLambertMaterial, VertexColors, Mesh } from 'three';

class Cloud extends Group {
    constructor() {
        // Call parent Group() constructor
        super();
        this.name = 'cloud';

        const material = new MeshLambertMaterial({
            vertexColors: VertexColors,
            flatShading: true, //required for flat shading
        });
        const sphere = new SphereGeometry(10, 32, 16);
        const cloud = new Mesh(sphere, material);
        this.add(cloud);
        this.mesh = cloud;
    }

    update(timeStamp) {
    }
}

export default Cloud;
