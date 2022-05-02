import * as THREE from 'three';
import { Group } from 'three';
import { Tree, Cloud, Cactus, Sheep, Penguin } from '..';

class Obstacle extends Group {
    constructor(init = false) {
        // Call parent Group() constructor
        super();

        this.name = 'obstacle';
        this.currentObj = "tree";
        if (init) this.newObjects();
    }

    newObjects() {
        this.objDictionary = {
            "tree": new Tree(),
            "cloud": new Cloud(),
            "cactus": new Cactus(),
            "sheep": new Sheep(),
            "penguin": new Penguin(),
        };
        for (const obj of Object.values(this.objDictionary)) {
            obj.visible = false;
            this.add(obj);
        }
    }

    makeDictionary() {
        this.objDictionary = {};
        for (const obj of this.children) {
            if (obj.name === undefined) console.log("Error!!! obstacle child has no .name property.");
            this.objDictionary[obj.name] = obj;
        }
    }

    clone() {
        const clone = super.clone();
        clone.makeDictionary();
        return clone;
    }


    setObstacle(name) {
        if (name in this.objDictionary) {
            this.objDictionary[this.currentObj].visible = false;
            this.currentObj = name;
            this.objDictionary[this.currentObj].visible = true;
        } else {
            console.log("Error! Tried to set obstacle to '" + name + "', but this is not a valid obstacle!");
            console.log("Valid obstacles: ", this.objDictionary);
        }
    }

}

export default Obstacle;
