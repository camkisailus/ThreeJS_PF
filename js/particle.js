import * as THREE from '../node_modules/three/build/three.module.js';

class ParticleFilter {
    constructor(n, jitter){
        this.n = n;
        this.particles = new Array();
        this.weights = new Array();
        this.observations = new Array();
        this.jitter_coeff = jitter;
        for(let i = 0; i < this.n; i++){
            this.particles.push(new Particle(Math.random()*50, Math.random()*50, Math.random()*50));
            this.weights.push(1 / this.n);
        }
        const fake_obs = new StaticObject(0, 0, 0);
        this.observations.push(fake_obs);
        this.add_observations = function(obj){
            this.observations.push(obj);
        }
        this.update_filter = function(){
            this.jitter();
            this.weight();
            this.resample();
        }
    }

    resample(){
        console.log(this.particles)
        console.log(this.weights)
        var temp_p = new Array();
        const r = Math.random() / this.n;
        var c = this.weights[0];
        var i = 1;
        for(let m = 1; m <= this.n; m++){
            const U = r + (m - 1)/this.n;
            while( U > c){
                i++;
                c += this.weights[i];

            }
            console.log(['i: ', i])
            console.log(['pushing: ', this.particles[i]])
            temp_p.push(this.particles[i]);
        }
        this.particles = temp_p;
        console.log(this.particles)

    }
    weight(){
        for(let i = 0; i < this.n; i++){
            const part = this.particles[i];
            var max_phi = 0;
            for(let j = 0; j < this.observations.length; j++){
                const obs = this.observations[j];
                const x_dist = Math.pow(obs.x - part.x, 2);
                const y_dist = Math.pow(obs.y - part.y, 2);
                const z_dist = Math.pow(obs.z - part.z, 2);
                const dist = Math.sqrt(x_dist + y_dist + z_dist);
                var phi = Math.exp(-5 * dist);
                if( phi > max_phi){
                    max_phi = phi;
                }
            }
            this.weights[i] = max_phi;
        }
        const weight_sum = this.weights.reduce((partialSum, a) => partialSum + a, 0);
        for (let k = 0; k < this.n; k++){
            this.weights[k] /= weight_sum;
        }
    }
    jitter(){
        for(let i = 0; i < this.n; i++){
            var rand = this.randn_bm();
            this.particles[i].mesh.position.x += rand * this.jitter_coeff;
            this.particles[i].mesh.position.y += rand * this.jitter_coeff;
            this.particles[i].mesh.position.z += rand * this.jitter_coeff;
        }
    }

    // Standard Normal variate using Box-Muller transform.
    randn_bm() {
        var u = 0, v = 0;
        while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
        while(v === 0) v = Math.random();
        return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    }
}
class StaticObject{
    constructor(x, y, z){
        this.x = x;
        this.y = y;
        this.z = z;
        this.geometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
        this.material = new THREE.MeshBasicMaterial({color: 0x11ff11});
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.x = x;
        this.mesh.position.y = y;
        this.mesh.position.z = z;
    }
}
class Particle{
    constructor(x, y, z){
        this.x = x;
        this.y = y;
        this.z = z;
        this.geometry = new THREE.SphereGeometry(0.05);
        this.material = new THREE.MeshBasicMaterial({color: 0x00ff00});
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.x = x;
        this.mesh.position.y = y;
        this.mesh.position.z = z;
    }

}

export { ParticleFilter };