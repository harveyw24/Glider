import * as THREE from 'three';
import { Group } from 'three';

const starColors = [
    new THREE.Color(0xfff4f3),
    new THREE.Color(0xc7d8ff),
    new THREE.Color(0xafc9ff),
    new THREE.Color(0xffa651),
    new THREE.Color(0x49d6ff),
    new THREE.Color(0x00ffec),
]
const starColorDist = [.8, .9, .95, .98, .99, 1]
function randomStarColor() {
    const rand = Math.random();
    for (const [i, p] of starColorDist.entries()) {
        if (rand < p) return starColors[i];
    }
}

class Stars extends Group {
    constructor(parent) {
        // Call parent Group() constructor
        super();

        // Init state
        this.name = "stars";
        this.state = {
            parent: parent,
            warp: false,
            becomingVisible: false
        };

        this.opacityDelta = 0.001;
        this.activeStarNum = 0;
        this.pointNum = 6000;
        this.xyRadius = 100;
        this.xyMin = 30;
        this.zRadius = 600;
        this.zThreshold = 20;
        this.pointAcceleration = 0.02;
        this.pointAngVel = 0.002;

        const starGeo = new THREE.Geometry();
        for (let i = 0; i < this.pointNum; i++) {
            let star = new THREE.Vector3(0, 0, Number.MAX_VALUE);
            star.velocity = 0;
            star.acceleration = this.pointAcceleration;
            starGeo.vertices.push(star);
            starGeo.colors.push(randomStarColor());
        }

        const sprite = new THREE.TextureLoader().load("https://raw.githubusercontent.com/harveyw24/Glider/main/src/components/objects/Stars/disc.png");
        const starMaterial = new THREE.PointsMaterial({
            vertexColors: THREE.VertexColors,
            size: 2,
            map: sprite,
            alphaTest: 0.5,
            transparent: true,
            opacity: 0.25,
        })

        this.points = new THREE.Points(starGeo, starMaterial);
        this.add(this.points);
    }

    randomXY() {
        let x = Math.random() * 2 * this.xyRadius - this.xyRadius;
        let y = Math.random() * 2 * this.xyRadius - this.xyRadius;
        const dist = Math.sqrt(x * x + y * y);
        const ratio = (dist + this.xyMin) / dist;
        return [x * ratio, y * ratio];
    }


    update() {
        if (this.state.becomingVisible) {
            this.points.material.opacity += this.opacityDelta;
            if (this.points.material.opacity >= 1.0) {
                this.points.material.opacity = 1.0;
                this.state.becomingVisible = false;
            }
        }
        if (this.state.warp) {
            this.points.geometry.vertices.forEach(p => {
                p.velocity += p.acceleration;
                p.z += p.velocity;

                if (p.z > this.zThreshold) {
                    p.z = -this.zRadius;
                }
            });
        } else {
            if (this.activeStarNum < this.pointNum) {
                this.points.geometry.vertices[this.activeStarNum].set(...this.randomXY(), this.zRadius - Math.random() * 2 * this.zRadius);
                this.activeStarNum++;
            }
            for (let i = 0; i < this.activeStarNum; i++) {
                const star = this.points.geometry.vertices[i];
                star.velocity += star.acceleration;
                star.z += star.velocity;

                if (star.z > this.zThreshold) {
                    star.velocity = 0;
                    star.z = -this.zRadius;
                    [star.x, star.y] = this.randomXY();
                }
            }
        }
        this.points.rotation.z += this.pointAngVel;
        this.points.geometry.verticesNeedUpdate = true;
    }




}

export default Stars;
