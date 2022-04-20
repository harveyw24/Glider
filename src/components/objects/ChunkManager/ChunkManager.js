import { Group, Color, PlaneBufferGeometry, PlaneGeometry } from 'three';
import { Chunk } from '../Chunk';

class ChunkManager extends Group {
    constructor(parent) {
        
        super();
        parent.addToUpdateList(this);

        this.chunks = [];

        const plane_geometry = new PlaneGeometry(200, 200, 20, 20);

        this.chunks.push(new Chunk(parent, 0, 0, 0, plane_geometry));
        this.add(this.chunks[0].terrain);

    }

    

    update(timeStamp) {
        
    }
}
export default ChunkManager;