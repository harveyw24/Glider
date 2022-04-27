import { Group, Geometry, SphereGeometry, MeshLambertMaterial, VertexColors, Mesh } from 'three';


const scale = 6;
const maxMainTufts = 3;
const maxSecondTufts = 4;

function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

function randomBi() {
    const r = Math.random();
    return r >= .5 ? r : r - 1;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

class Cloud extends Group {
    constructor() {
        // Call parent Group() constructor
        super();
        this.name = 'cloud';

        const material = new MeshLambertMaterial({
            color: "white",
            flatShading: true, //required for flat shading
        });
        const geo = new Geometry()

        // const decay = .7;
        // for (const sign of [-1, 1]) {
        //     const max = randomRange(1, maxMainTufts);
        //     let tuftScale = scale;
        //     const center = [0, 0, 0];
        //     for (let i = 0 + (sign - 1) / 2; i < max; i++, tuftScale *= decay) {
        //         const radius = 1.5 * tuftScale;
        //         const tuft = new SphereGeometry(radius, 7, 8);
        //         if (i != 0) center[0] += sign * radius * (1 + 1 / decay) * .7;
        //         tuft.translate(...center);

        //         geo.merge(tuft);
        //     }
        // }
        // //randomly displace the x,y,z coords by the `per` value
        // const jitter = (geo, per) => geo.vertices.forEach(v => {
        //     v.x += randomRange(-per, per);
        //     v.y += randomRange(-per, per);
        //     v.z += randomRange(-per, per);
        // })
        // jitter(geo, 0.15 * scale)



        const tuft = new SphereGeometry(1.5 * scale, 7, 8);
        geo.merge(tuft);

        const cloud = new Mesh(geo, material);
        this.add(cloud);
        this.mesh = cloud;
    }

    update(timeStamp) {
    }
}

export default Cloud;
