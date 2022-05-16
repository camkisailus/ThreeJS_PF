import * as THREE from '../node_modules/three/build/three.module.js';

class ParticleFilter {
    constructor(n, valid_regions, jitter){
        this.n = n;
        this.particles = new Array(n);
        this.weights = new Array(n);
        this.observations = new Array();
        this.jitter_coeff = jitter;
        for(let i = 0; i < this.n; i++){
            var region_idx = i % valid_regions.length;

            var x = valid_regions[region_idx].min.x + Math.random() * (valid_regions[region_idx].max.x - valid_regions[region_idx].min.x);
            var y = valid_regions[region_idx].min.y + Math.random() * (valid_regions[region_idx].max.y - valid_regions[region_idx].min.y);
            var z = valid_regions[region_idx].min.y + Math.random() * (valid_regions[region_idx].max.z - valid_regions[region_idx].min.z);
            console.log([x, y, z])
            // var x = Math.random() * 5;
            // var y = Math.random() * 5;
            // var z = Math.random() * 5;
            // if (x < 2.5){
            //     x *= -1;
            // }else{
            //     x -= 2.5;
            // }
            // if (y < 2.5){
            //     y *= -1;
            // }else{
            //     y -= 2.5;
            // }
            // if (z < 2.5){
            //     z *= -1;
            // }else{
            //     z -= 2.5;
            // }
            var part = new Particle(x, y, z);
            this.particles[i] = part;
            this.weights[i] = 1 / this.n;
        }
        const fake_obs = new StaticObject(0, 0, 0);
        this.observations.push(fake_obs);
        this.add_observations = function(obj){
            this.observations.push(obj);
        }
        this.update_filter = function(){
            this.jitter();
            this.weight();
            // this.resample();
            // this.observations[0].x += 0.1;
        }
    }

    resample() {

        //The CDF will determine the index used for draw with replacement.
        //Cumulative Distribution Function 
        var CDF = new Array(this.n);
        var sum = 0.0;
        for (var i = 0; i < this.n; i++) {
            sum += this.weights[i];
            CDF[i] = sum;
        }

        //Deep copy is needed for resampling.
        this.particlesDeepCopy = new Array(this.n);
        for (var i =0 ;i < this.n ; i++)
          {
            this.particlesDeepCopy[i] = new Particle(this.particles[i].x, this.particles[i].y, this.particles[i].z);
          }

        //The best sample is allocated at the begining of the particle list.
        this.getBestSample()
        for (var i=0; i < 2;i++)
        {   
            // Update particle values don't overwrite
            this.particles[i] = this.ArgMaxWeightParticle;
        }


        //Draw with replacement routine.
        var index = 0;
        for (var i = 2; i < this.n; i++) {

            //Sampling from uniform distribution
            var sample = Math.random();

            for (var k = 1; k < this.n; k++) {
                if ( (CDF[k-1] < sample) && (CDF[k] > sample) )
                {
                    index = k;
                    break;
        
                }
            }
            if ( sample >= CDF[this.n-1] )
                index = this.n-1;

            this.particles[i] = this.particlesDeepCopy[index];
        }
    }

    getBestSample(){
        var max = this.weights[0];
        var maxIdx = 0;
        for(let i = 0; i < this.n; i++){
            if (this.weights[i] > max){
                max = this.weights[i];
                maxIdx = i;
            }
        }
        this.ArgMaxWeightParticle = this.particles[maxIdx];
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
                var phi = Math.exp(-50 * dist);
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
            var x = rand* this.jitter_coeff;
            var y = rand* this.jitter_coeff;
            var z = rand* this.jitter_coeff;
            this.particles[i].update_position(x, y, z);
            // this.particles[i].mesh.position.x += rand * this.jitter_coeff;
            // this.particles[i].mesh.position.y += rand * this.jitter_coeff;
            // this.particles[i].mesh.position.z += rand * this.jitter_coeff;
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
        this.material = new THREE.MeshBasicMaterial({color: 0xFF5733});
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.x = x;
        this.mesh.position.y = y;
        this.mesh.position.z = z;

        this.show = function(scene){
            scene.add(this.mesh);
        }
    }
}
class Particle{
    constructor(x, y, z){
        this.x = x;
        this.y = y;
        this.z = z;
        this.geometry = new THREE.SphereGeometry(.5);
        this.material = new THREE.MeshBasicMaterial({color: 0x00ff00});
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.x = x;
        this.mesh.position.y = y;
        this.mesh.position.z = z;

        this.update_position = function(x, y, z){
            this.x = x;
            this.y = y;
            this.z = z;
            this.mesh.position.x = x;
            this.mesh.position.y = y;
            this.mesh.position.z = z;
        }
        this.show = function(scene){
            scene.add(this.mesh);
        }
    }

}

export { ParticleFilter };