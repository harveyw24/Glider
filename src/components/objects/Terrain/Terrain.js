import { Group, Color, PlaneBufferGeometry, VertexColors, PlaneGeometry, MeshStandardMaterial, MeshLambertMaterial, Mesh, Vector2} from 'three';
import  SimplexNoise  from 'simplex-noise';
//import { Water } from 'three/examples/js/objects/Water.js';

const terrainSize = {width: 1000, height: 1000, vertsWidth: 100, vertsHeight: 100};

class Terrain extends Group {

    constructor(parent, xOffset, yOffset, zOffset) {
        // Call parent Group() constructor
        super();

        // take state from parent = chunkManager
        this.state = parent.state;

        this.state.xOffset = xOffset;
        this.state.yOffset = yOffset;
        this.state.zOffset = zOffset;

        // create the plane
        this.geometry = new PlaneGeometry(terrainSize.width,terrainSize.height,
                                    terrainSize.vertsWidth-1,terrainSize.vertsHeight-1);
        this.geometry.verticesNeedUpdate = true;
        this.geometry.colorsNeedUpdate = true;


        // get perline noise height map and update the geometry
        this.heightMap = this.generateTexture()
        this.updateTerrainGeo();

        //required for flat shading
        this.geometry.computeFlatVertexNormals();
        const terrain = new Mesh(this.geometry, new MeshLambertMaterial({
            // wireframe:true,
            vertexColors: VertexColors,
            //required for flat shading
            flatShading: true,
        }))

        // update location on the map
        let groundY = -200 //-249;
        terrain.position.y = groundY - 1;
        terrain.rotation.x = -Math.PI / 2;
        terrain.receiveShadow = true;

        this.add(terrain);

        // Add self to parent's update list
        // parent.addToUpdateList(this);

    }

    update(timeStamp, x, y, z) {
        // update colors, "land breathing", etc
        /*console.log("update")
        var offset = this.state.breathOffset*Math.sin(timeStamp/(this.state.breathLength*1000));
        offset *= 10;
        console.log(offset)
        for(let i = 0; i < this.geometry.vertices.length; i++) {
          console.log("z = " + this.geometry.vertices[i].z);
          if(this.geometry.vertices[i] > this.state.waterLevel) {
            this.geometry.vertices[i].z = this.geometry.vertices[i].z + offset;
          }
        } */

        //console.log("TS = " + timeStamp + "(" + x + ", " + y + ", " + z + ")")
    }

    updateTerrainGeo() {
      //assign vert heights in geometry
      for(let j = 0; j < this.heightMap.length; j++) {
          for (let i = 0; i < this.heightMap[0].length; i++) {
              const index = (j*(this.heightMap.length)+i)
              const v1 = this.geometry.vertices[index]
              v1.z = this.heightMap[j][i]*this.state.exaggeration*10
              // set to water level if below water
              v1.z = Math.max(this.state.waterLevel, v1.z)
          }
      }

      //for every face calculate the color, do some gradient calculations to make it polygons
      this.geometry.faces.forEach(f => {
          //get three verts for the face
          const a = this.geometry.vertices[f.a]
          const b = this.geometry.vertices[f.b]
          const c = this.geometry.vertices[f.c]

          //assign colors based on the average point of the face
          var wiggle = this.state.colorWiggle * 25;
          const max = (a.z+b.z+c.z)/3
          if(max <= this.state.waterLevel) {
            return f.color.setRGB((this.state.waterColor.r + Math.random()*wiggle)/255,
            (this.state.waterColor.g + Math.random()*wiggle)/255,
            (this.state.waterColor.b + Math.random()*wiggle)/255)
        //     geometry2.faceVertexUvs[0].push([
        //     new THREE.Vector2(0,0),        //play with these values
        //     new THREE.Vector2(0.5,0),
        //     new THREE.Vector2(0.5,0.5)
        //
        // ]);
        // geometry2.uvsNeedUpdate = true;
          }
          if(max - this.state.waterLevel > this.state.exaggeration*7) return f.color.setRGB((this.state.peakColor.r+ Math.random()*wiggle)/255, (this.state.peakColor.g+ Math.random()*wiggle)/255, (this.state.peakColor.b+ Math.random()*wiggle)/255)

          var ratio = (max - this.state.waterLevel)/(this.state.exaggeration*7);

          // upper half? blend middle with peak
          if(ratio >= this.state.middleGradient) {
            ratio = (ratio-this.state.middleGradient)/this.state.middleGradient;
            return f.color.setRGB((this.state.peakColor.r*ratio + this.state.middleColor.r*(1-ratio)
            + Math.random()*wiggle)/255,
            (this.state.peakColor.g*ratio + this.state.middleColor.g*(1-ratio) + Math.random()*wiggle)/255,
            (this.state.peakColor.b*ratio + this.state.middleColor.b*(1-ratio) + Math.random()*wiggle)/255);
          }

          ratio = (ratio)/this.state.middleGradient;
          return f.color.setRGB((this.state.middleColor.r*ratio + this.state.bankColor.r*(1-ratio) + Math.random()*wiggle)/255,
                                    (this.state.middleColor.g*ratio + this.state.bankColor.g*(1-ratio) + Math.random()*wiggle)/255,
                                    (this.state.middleColor.b*ratio + this.state.bankColor.b*(1-ratio) + Math.random()*wiggle)/255);

      })

      this.geometry.verticesNeedUpdate = true;
      this.geometry.colorsNeedUpdate = true;
      this.geometry.computeFlatVertexNormals();
    }

    updateSimplexSeed() {
      // this.simplex = new SimplexNoise(this.state.randSeed);

      this.updateNoise();
    }

    updateNoise() {
      this.heightMap = this.generateTexture();

      this.updateTerrainGeo();
    }

    // from https://medium.com/@joshmarinacci/low-poly-style-terrain-generation-8a017ab02e7b
    noise(nx, ny, simplex) {
        // Is in range -1.0:+1.0
        return simplex.noise2D(nx,ny);
    }
    //stack some noisefields together
    octave(nx,ny,octaves, simplex) {
        let val = 0;
        let freq = this.state.freq;
        let max = 0;
        let amp = 1; //this.state.amplitude;
        for(let i=0; i<octaves; i++) {
            val += this.noise(nx*freq,ny*freq, simplex)*amp;
            max += amp;
            amp /= 2;
            freq  *= 2;
        }
        return val/max;
    }

    //generate noise
    generateTexture() {
        // make 2d array
        var simplex = new SimplexNoise(this.state.randSeed);

        const canvas = new Array(terrainSize.vertsHeight);
        for (var i = 0; i < canvas.length; i++) {
          canvas[i] = new Array(terrainSize.vertsWidth);
        }

        console.log(this.state.zOffset);
        for(let i = 0; i<terrainSize.vertsHeight; i++) {
            for(let j=0; j<terrainSize.vertsWidth; j++) {
                let nx = j/terrainSize.vertsWidth;;
                let ny = (i + this.state.zOffset/10 - this.state.zOffset/this.state.chunkWidth)/terrainSize.vertsHeight;
                let v =  this.octave(nx, ny, this.state.octaves, simplex);
                if (j == 0) console.log(nx, ny);
                canvas[i][j] = v;
            }
        }
        return canvas
    }

}

export default Terrain;