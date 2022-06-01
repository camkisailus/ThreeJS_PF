import * as THREE from '../node_modules/three/build/three.module.js';

class ParticleFilter {
    constructor(n, valid_regions, color){
        this.n = n;
        this.particles = new Array(n);
        this.weights = new Array(n);
        this.jitter_coeff = 0.5;
        this.reinvigoration_idx = 0;
        this.valid_regions = valid_regions;
        for(let i = 0; i < this.n; i++){
            var part = new Particle(0, 0, 0, color);
            this.particles[i] = this.reinvigorate(part);
            this.weights[i] = 1 / this.n;
        }
    }

    show(scene){
        // for(let i = 0; i < this.particles.length; i++){
        //     this.particles[i].show(scene);
        // }
        var shown_particles = 0;
        const min_weight = Math.min(...this.weights); 
        const weight_range = Math.max(...this.weights) - min_weight;
        // console.log( max_weight, min_weight, thresh)
        
        for(let i = 0; i < this.particles.length; i++){
            if(weight_range != 0){
                const opacity = (this.weights[i] - min_weight) / (weight_range);
                this.particles[i].update_opacity(opacity);
            }
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

    jitter_particle(particle){
        var x = this.particles[i].x + this.#randn_bm()* this.jitter_coeff;
        var y = this.particles[i].y + this.#randn_bm()* this.jitter_coeff;
        var z = this.particles[i].z + this.#randn_bm()* this.jitter_coeff;
        particle.update_position(x, y, z);
    }

    low_variance_resample(num_samples){
        // if(this.label === 'grasp_spoon'){
        //     console.log(this.particles);
        //     console.log(this.weights);
        // }
        
        var samples = new Array();
        var cum_sum_arr = this.#cumulative_sum(this.weights);
        // if(this.label === 'grasp_spoon'){
        //     console.log(cum_sum_arr);
        // }
        for(let i = 0; i < num_samples; i++){
            var sample_idx = this.#random_sample(cum_sum_arr);
            var sample = this.particles[sample_idx];
            // if(this.label === 'grasp_spoon'){
            //     console.log('sample idx: ', sample_idx);
            //     console.log('sample: ', sample);
            // }
            samples.push(sample);
        }
        // console.log(samples);
        return samples;
        
        
        
        var w = this.#cumulative_sum(this.weights);
        var sample_idx = this.#random_sample(w);
        return this.particles[sample_idx];
        let sampled_particles = new Array();
        for(let i = 0; i < this.n*0.95; i++){
            sampled_particles.push(this.particles[this.#random_sample(w)]);
        }
        for(let i = 0; i < this.n; i++){
            if( i < sampled_particles.length){
                this.particles[i].update_position(sampled_particles[i].x, sampled_particles[i].y, sampled_particles[i].z);
            }else{
                this.particles[i] = this.reinvigorate(this.particles[i]);
            }

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
    reinvigorate(particle){
        const region_idx = this.reinvigoration_idx % this.valid_regions.length;
        const region = this.valid_regions[region_idx];
        const x = Math.floor(Math.random() * (region.max.x - region.min.x)) + region.min.x;
        const y = Math.floor(Math.random() * (region.max.y - region.min.y)) + region.min.y;
        const z = Math.floor(Math.random() * (region.max.z - region.min.z)) + region.min.z;
        particle.update_position(x, y, z);
        this.reinvigoration_idx++;
        return particle;
    }


    getBestSample(){
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

class FrameParticleFilter extends ParticleFilter{
    constructor(n, label, valid_regions){//, preconditions, core_frame_elems){
        let color;
        if(label == 'grasp_spoon'){
            color = 0x0000ff;
        }else if(label == 'grasp_mug'){
            color = 0xff0000;
        }else if(label == 'stir_mug'){
            color = 0x00ff00;
        }
        super(n, valid_regions, color)
        // this.particles[0] = new Particle(5, 4, -12, 0x0000ff);
        // this.particles[1] = new Particle(8, 4, -12), 0x0000ff;
        // this.particles[2] = new Particle(6.5, 4, -12, 0x0000ff);
        // this.particles[3] = new Particle(6.5, 8, -12, 0x0000ff);
        // this.particles[4] = new Particle(6.5, -10, -12, 0x0000ff);
        this.label = label;
        this.frame_elems = new Array();
        this.frame_elems_filters = new Array();
        this.preconditions = new Array();
        this.precondition_filters = new Array();
        this.state = ['Idle'];
        // for(let i = 0; i < core_frame_elems.length; i++){
        //     if(core_frame_elems[i]!= 'None'){
        //         this.frame_elems.push(core_frame_elems[i]);
        //     }
        // }
        // for(let i = 0; i < preconditions.length; i++){
        //     if(preconditions[i] != 'None'){
        //         this.preconditions[i].push(preconditions[i]);
        //     }else{
        //         this.preconditions.push('None');
        //     }
        // }   
        // console.log("Init weights: ", this.weights);
    }

    add_frame_elem(frame_filter, frame_name){
        this.frame_elems_filters.push(frame_filter);
        this.frame_elems.push(frame_name);
    }

    add_precondition(p_filter, p_name){
        this.preconditions.push(p_name);
        this.precondition_filters.push(p_filter);
    }

    update_filter(scene){
        super.jitter();
        this.#weight();
        super.show(scene);
        this.#resample();
        // console.log('after resample: ', this.particles);
        // console.log("UPDATE FINISHED");

    }

    #resample(){
        // console.log(this.particles)
        // console.log(this.weights)
        const best_sample = super.getBestSample();
        const best_sample_copy = new Particle(best_sample.x, best_sample.y, best_sample.z, best_sample.color);
        // console.log('best_sample: ', best_sample.x, best_sample.y, best_sample.z);
        var particles_added = 0;
        const resample_count = Math.floor(this.n*.2);
        const resampled_particles = super.low_variance_resample(resample_count);
        // console.log('resampled: ', resampled_particles)
        for(let i = 0; i < resample_count; i++){
            this.particles[i].update_position(resampled_particles[i].x, resampled_particles[i].y, resampled_particles[i].z);
            this.weights[i] = 1 / this.n;
            particles_added++;
        }
        for(let j = particles_added; j < this.n; j++){
            this.particles[j].update_position(best_sample_copy.x, best_sample_copy.y, best_sample_copy.z);  

        }
        // for(let j = 0; j < this.n; j++){
        //     this.particles[j] = super.reinvigorate(this.particles[j]);
        //     this.weights[j] = 1 / this.n;
        // }


    }

    #weight(){
        for(let i = 0; i < this.n; i++){
            const part = this.particles[i];
            const measurement = this.#measurement_potential(part, this.state);
            this.weights[i] = measurement;
            // const context = this.#context_potential(part, this.state);
        }
        // Normalize
        const weight_sum = this.weights.reduce((partialSum, a) => partialSum + a, 0);
        for (let k = 0; k < this.n; k++){
            this.weights[k] /= weight_sum;
        }
        // console.log("After update weights: ", this.weights);
    }

    #measurement_potential(particle, state){
        // console.log('particle_loc: ', particle.x, particle.y, particle.z);
        var potential = 1;
        var idx = 0;
        // determine which object action is most likely near
        if(this.preconditions[0] != 'None'){
            for(let i = 0; i < this.preconditions.length; i++){
                if(!state.include(this.preconditions[i])){
                    break;
                }else{
                    idx++;
                }
            }
        }
        // console.log(this.frame_elems_filters);
        const core_elem_filter = this.frame_elems_filters[[idx]];
        var close_to = 0;
        for(let i = 0; i < core_elem_filter.particles.length; i++){
            const other_part = core_elem_filter.particles[i];
            var x_dist = Math.pow(other_part.x - particle.x, 2);
            var y_dist = Math.pow(other_part.y - particle.y, 2);
            var z_dist = Math.pow(other_part.z - particle.z, 2);
            var dist = Math.sqrt(x_dist + y_dist + z_dist);
            var phi = Math.exp(-1/2 * dist);
            // console.log('dist: ',dist, ' phi: ',phi);
            if(phi >= 0.5){
                close_to++;
                potential += core_elem_filter.weights[i];
            }
        }
        // console.log("close to: ", close_to);
        // console.log('potential: ', potential)
        return potential;
    }
}

class ObjectParticleFilter extends ParticleFilter{
    constructor(n, label, valid_regions, color){
        super(n, valid_regions, color);
        // this.particles = new Array(5);
        // this.particles[0] = new Particle(5, 4, -12, color);
        // this.particles[1] = new Particle(8, 4, -12), color;
        // this.particles[2] = new Particle(6.5, 4, -12, color);
        // this.particles[3] = new Particle(6.5, 8, -12, color);
        // this.particles[4] = new Particle(6.5, -10, -12, color);

        this.label = label;
        this.observations = new Array();
        // const fake_obs = new StaticObject(5, 4, -12);
        // const other_obs = new StaticObject(8, 4, -12);
        // this.observations.push(other_obs);
        // this.observations.push(fake_obs);
    }

    add_observation(x, y, z){
        this.observations.push(new StaticObject(x, y, z));
    }

    update_filter(scene){
        super.jitter();
        this.#weight();
        this.show(scene);
        this.#resample();
        // console.log("UPDATE FINISIHED")
    }

    show(scene){
        super.show(scene);
        for(let i =0; i < this.observations.length; i++){
            this.observations[i].show(scene);
        }
    }
    #resample(){
        if(this.observations.length === 0){
            for(let i = 0; i < this.n; i++){
                this.particles[i] = super.reinvigorate(this.particles[i]);
                this.weights[i] = 1 / this.n;
            }
        }else{
            var num_particles_added = 0;
            // low var resample
            const resample_count = Math.floor(this.n*0.4);
            const resampled_particles = super.low_variance_resample(resample_count);
            for(let i = 0; i < resample_count; i++){
                this.particles[i].update_position(resampled_particles[i].x, resampled_particles[i].y, resampled_particles[i].z)
                num_particles_added++;
            }

            // reinvigorate
            for(let i = num_particles_added; i < this.n*0.2; i++){
                this.particles[i] = super.reinvigorate(this.particles[i]);
                num_particles_added++;
            }
            
            // rest go to ground truth
            for(let i = num_particles_added; i < this.n; i++){
                const obs = this.observations[i%this.observations.length];
                this.particles[i].update_position(obs.x, obs.y, obs.z);
            }
            
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
                var max_phi_m = 0;
                // Calculate phi_m
                for(let j = 0; j < this.observations.length; j++){
                    var obs = this.observations[j];
                    var x_dist = Math.pow(obs.x - part.x, 2);
                    var y_dist = Math.pow(obs.y - part.y, 2);
                    var z_dist = Math.pow(obs.z - part.z, 2);
                    var dist = Math.sqrt(x_dist + y_dist + z_dist);
                    var phi = Math.exp(-1 * dist);
                    if( phi > max_phi_m){
                        max_phi_m = phi;
                    }
                }
                this.weights[i] = max_phi_m;
                // sum over all relations
                // for(let r = 0; r < this.relations.length; r++){
                //     // sum over all landmarks
                //     for(let l = 0; l < this.landmarks.length; l++){

                    
                //     }
                // }

                // Calculate phi_r
            }
            // this.weights = phi_m;
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
        this.material = new THREE.MeshBasicMaterial({color: color, transparent: true});
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.x = x;
        this.mesh.position.y = y;
        this.mesh.position.z = z;
    }

    update_opacity(o){
        this.material.opacity = o;
    }

    update_position(x, y, z){
        this.x = x;
        this.y = y;
        this.z = z;
        this.mesh.position.x = x;
        this.mesh.position.y = y;
        this.mesh.position.z = z;
    }
    show(scene){
        scene.add(this.mesh);
    }

}

export { ObjectParticleFilter, FrameParticleFilter };