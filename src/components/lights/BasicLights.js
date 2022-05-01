import { Group, SpotLight, AmbientLight, HemisphereLight, DirectionalLight } from 'three';

class BasicLights extends Group {
    constructor(...args) {
        // Invoke parent Group() constructor with our args
        super(...args);

        this.hemiLight = new HemisphereLight(0xFF8F00, 0xffffff, 0.9)
        this.hemiLight.castShadow = true;

        this.dirLight = new DirectionalLight(0xffffff, 0.9);
        this.dirLight.position.set(-1, 10, 5);

        // this.dirLight = new SpotLight(0xffffff, 1.6, 7, 0.8, 1, 1);
        // this.dirLight.position.set(5, 1, 2);
        // this.dirLight.target.position.set(0, 0, 0);

        // const ambi = new AmbientLight(0x404040, 1.32);
        // const hemi = new HemisphereLight(0xffffbb, 0x080820, 1.4);

        // this.add(ambi, hemi, dir);
        this.add(this.hemiLight, this.dirLight);
    }
}

export default BasicLights;
