import * as THREE from '../node_modules/three/build/three.module.js';

class ParticleFilter {
    constructor(n, valid_regions){
        this.n = n;
        this.particles = new Array(n);
        this.weights = new Array(n);
        this.jitter_coeff = 0.5;
        this.reinvigoration_idx = 0;
        this.valid_regions = valid_regions;
        for(let i = 0; i < this.n; i++){
            var part = new Particle(0, 0, 0, 0x00ff00);
            this.particles[i] = this.#reinvigorate(part);
            this.weights[i] = 1 / this.n;
        }
    }

    show(scene){
        for(let i = 0; i < this.particles.length; i++){
            this.particles[i].show(scene);
        }

    }

    jitter(){
        for(let i = 0; i < this.n; i++){
            var x = this.particles[i].x + this.#randn_bm()* this.jitter_coeff;
            var y = this.particles[i].y + this.#randn_bm()* this.jitter_coeff;
            var z = this.particles[i].z + this.#randn_bm()* this.jitter_coeff;
            this.particles[i].update_position(x, y, z);
        }
    }

    low_variance_resample(){
        // console.log(this.particles);
        // console.log(this.weights);
        let w = this.#cumulative_sum(this.weights);
        let sampled_particles = new Array();
        for(let i = 0; i < this.n*0.8; i++){
            sampled_particles.push(this.particles[this.#random_sample(w)]);
        }
        for(let i = 0; i < this.n; i++){
            if( i < sampled_particles.length){
                this.particles[i].update_position(sampled_particles[i].x, sampled_particles[i].y, sampled_particles[i].z);
            }else{
                this.particles[i] = this.#reinvigorate(this.particles[i]);
            }

        }
        // var particles_added = 0;
        // var temp_particles = new Array();
        // var w = this.#cumulative_sum(this.weights);
        // var r = Math.random() / this.n;
        // var j = 0;
        // const best_particle = this.#getBestSample();
        // console.log(best_particle);
        // temp_particles.push(best_particle);
        // temp_particles.push(this.jitter(best_particle));
        // particles_added = 2;
        // Use low variance resampling to generate temp_particles
        // for(let i = 0; i < this.n; i++){
        //     var u = r + (i-1) / this.n;
        //     while(u > w[j]){
        //         j += 1;
        //     }
        //     temp_particles.push(this.particles[j]);
        //     particles_added++;
        //     if(particles_added > this.n*0.9){
        //         break;
        //     }
        // }
        // // Reinvigorate the rest
        // for(let i = particles_added; i < this.n; i++){
        //     temp_particles.push(this.#reinvigorate(this.particles[i]));
        // }
        // // Replace this.particles with temp_particles
        // for(let i = 0; i < this.n; i++){
        //     this.particles[i].update_position(temp_particles[i].x, temp_particles[i].y, temp_particles[i].z);
        // }
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
        for (var i = 0; i < this.n; i++)
          {
            this.particlesDeepCopy[i] = new Particle(this.particles[i].x, this.particles[i].y, this.particles[i].z);
          }

        //The best sample is allocated at the begining of the particle list.
        this.#getBestSample()
        for (var i=0; i < 2;i++)
        {   
            // Update particle values don't overwrite
            this.particles[i].update_position(this.ArgMaxWeightParticle.x, this.ArgMaxWeightParticle.y, this.ArgMaxWeightParticle.z);
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

            this.particles[i].update_position(this.particlesDeepCopy[index].x, this.particlesDeepCopy[index].y, this.particlesDeepCopy[index].z); // = this.particlesDeepCopy[index];
        }
    }

    #random_sample(cum_sum){
        // Random number [0,...,1)
        let sample = Math.random();
        for(let i = 0; i < this.n; i++){
            if(sample < cum_sum[i]){
                return i;
            }
        }

    }

    #cumulative_sum(weights_arr){
        var sum = new Array(this.n);
        for(let i = 0; i < this.n; i++){
            if(i===0){
                sum[i] = weights_arr[i];
            }else{
                sum[i] = sum[i-1]+weights_arr[i];
            }
        }
        return sum;
    }
    #reinvigorate(particle){
        const region_idx = this.reinvigoration_idx % this.valid_regions.length;
        const region = this.valid_regions[region_idx];
        const x = Math.floor(Math.random() * (region.max.x - region.min.x)) + region.min.x;
        const y = Math.floor(Math.random() * (region.max.y - region.min.y)) + region.min.y;
        const z = Math.floor(Math.random() * (region.max.z - region.min.z)) + region.min.z;
        particle.update_position(x, y, z);
        this.reinvigoration_idx++;
        return particle;
    }


    #getBestSample(){
        var max = this.weights[0];
        var maxIdx = 0;
        for(let i = 1; i < this.n; i++){
            if (this.weights[i] > max){
                max = this.weights[i];
                maxIdx = i;
            }
        }
        return this.particles[maxIdx];
    }

    // Standard Normal variate using Box-Muller transform.
    #randn_bm() {
        var u = 0, v = 0;
        while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
        while(v === 0) v = Math.random();
        return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    }
}

class ObjectParticleFilter extends ParticleFilter{
    constructor(n, label, valid_regions){
        super(n, valid_regions);
        this.label = label;
        this.observations = new Array();
        const fake_obs = new StaticObject(5, 4, -12);
        const other_obs = new StaticObject(8, 4, -12);
        this.observations.push(other_obs);
        this.observations.push(fake_obs);
    }

    add_observation(x, y, z){
        this.observations.push(new StaticObject(x, y, z));
    }

    update_filter(){
        super.jitter();
        this.#weight();
        super.low_variance_resample();
    }

    show(scene){
        super.show(scene);
        for(let i =0; i < this.observations.length; i++){
            this.observations[i].show(scene);
        }
    }

    #weight(){
        // No info in scene
        if(this.observations.length === 0){
            for(let i = 0; i < this.n; i++){
                this.weights[i] = 1;
            }
        }
        else{
            // Iterate through each particle
            for(let i = 0; i < this.n; i++){
                const part = this.particles[i];
                var max_phi = 0;
                // Iterate through all observations
                for(let j = 0; j < this.observations.length; j++){
                    var obs = this.observations[j];
                    var x_dist = Math.pow(obs.x - part.x, 2);
                    var y_dist = Math.pow(obs.y - part.y, 2);
                    var z_dist = Math.pow(obs.z - part.z, 2);
                    var dist = Math.sqrt(x_dist + y_dist + z_dist);
                    var phi = Math.exp(-1 * dist);
                    if( phi > max_phi){
                        max_phi = phi;
                    }
                }
                this.weights[i] = max_phi;
            }
        }
        // Normalize
        const weight_sum = this.weights.reduce((partialSum, a) => partialSum + a, 0);
        for (let k = 0; k < this.n; k++){
            this.weights[k] /= weight_sum;
        }
    }
}


class StaticObject{
    constructor(x, y, z){
        this.x = x;
        this.y = y;
        this.z = z;
        this.geometry = new THREE.BoxGeometry(1,1,1,);
        this.material = new THREE.MeshBasicMaterial({color: 0xFF0000});
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
    constructor(x, y, z, color){
        this.x = x;
        this.y = y;
        this.z = z;
        this.geometry = new THREE.SphereGeometry(.5);
        this.material = new THREE.MeshBasicMaterial({color: color, opacity: 0.5});
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

export { ObjectParticleFilter };