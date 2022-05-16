import * as THREE from '../node_modules/three/build/three.module.js';


class Region{
    constructor(min_x, min_y, min_z, max_x, max_y, max_z){
        this.min = new THREE.Vector3(min_x, min_y, min_z);
        this.max = new THREE.Vector3(max_x, max_y, max_z);
    }
}

export { Region };