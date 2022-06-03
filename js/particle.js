import * as THREE from '../node_modules/three/build/three.module.js';

class ParticleFilter {
    constructor(n, valid_regions, color, shape){
        this.n = n;
        this.particles = new Array(n);
        this.weights = new Array(n);
        this.jitter_coeff = 0.25;
        this.reinvigoration_idx = 0;
        this.valid_regions = valid_regions;
        this.region_reinvig_p = new Array(this.valid_regions.length);
        // get total volume of all valid regions
        var total_volume = 0;
        var indivual_volumes = new Array(valid_regions.length);
        for(let i = 0; i < valid_regions.length; i++){
            const region = this.valid_regions[i];
            const length = region.max.x - region.min.x;
            const width = region.max.y - region.min.y;
            const height = region.max.z - region.min.z;
            const volume = length*width*height;
            indivual_volumes[i] = volume;
            total_volume += volume;
        }
        for(let i = 0; i < this.region_reinvig_p.length; i++){
            this.region_reinvig_p[i] = indivual_volumes[i] / total_volume;
        }
        this.region_reinvig_p = this.#cumulative_sum(this.region_reinvig_p);
        for(let i = 0; i < this.n; i++){
            var part = new Particle(0, 0, 0, color, shape);
            this.particles[i] = this.reinvigorate(part);
            this.weights[i] = 1 / this.n;
        }

    }

    show(scene){
        const min_weight = Math.min(...this.weights); 
        const weight_range = Math.max(...this.weights) - min_weight;
        
        for(let i = 0; i < this.particles.length; i++){
            if(weight_range != 0){
                var opacity = 0.25 + (this.weights[i] - min_weight) / (weight_range);
                if(opacity > 1.0){
                    opacity = 1.0;
                }
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
        var x = particle.x + this.#randn_bm()* this.jitter_coeff;
        var y = particle.y + this.#randn_bm()* this.jitter_coeff;
        var z = particle.z + this.#randn_bm()* this.jitter_coeff;
        particle.update_position(x, y, z);
    }

    low_variance_resample(num_samples){
        var samples = new Array();
        var cum_sum_arr = this.#cumulative_sum(this.weights);

        for(let i = 0; i < num_samples; i++){
            var sample_idx = this.#random_sample(cum_sum_arr);
            var sample = this.particles[sample_idx];
            samples.push(sample);
        }
        return samples;
    }

    reinvigorate(particle){
        // console.log(particle);
        var region_idx = this.#random_sample(this.region_reinvig_p);
        const region = this.valid_regions[region_idx];
        const x = Math.floor(Math.random() * (region.max.x - region.min.x)) + region.min.x;
        const y = Math.floor(Math.random() * (region.max.y - region.min.y)) + region.min.y;
        const z = Math.floor(Math.random() * (region.max.z - region.min.z)) + region.min.z;
        particle.update_position(x, y, z);
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
        var sum = new Array(weights_arr.length);
        for(let i = 0; i < sum.length; i++){
            if(i===0){
                sum[i] = weights_arr[i];
            }else{
                sum[i] = sum[i-1]+weights_arr[i];
            }
        }
        return sum;
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
            color = 0xA233FF;
        }
        super(n, valid_regions, color, 'box')
        this.label = label;
        this.frame_elems = new Array();
        this.frame_elems_filters = new Array();
        this.preconditions = new Array();
        this.precondition_filters = new Array();
        this.state = ['idle'];
        console.log('label: ', this.label, ' rp: ', this.region_reinvig_p);
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
        // super.jitter();
        this.weight();
        super.show(scene);
        this.resample();

    }

    resample(){
        const best_sample = super.getBestSample();
        const best_sample_copy = new Particle(best_sample.x, best_sample.y, best_sample.z, best_sample.color);
        var particles_added = 0;
        const resample_count = Math.floor(this.n*.80);
        const resampled_particles = super.low_variance_resample(resample_count);
        for(let i = 0; i < resample_count; i++){
            this.particles[i].update_position(resampled_particles[i].x, resampled_particles[i].y, resampled_particles[i].z);
            this.weights[i] = 1 / this.n;
            particles_added++;
        }
        for(let i = resample_count; i < this.n; i++){
            super.reinvigorate(this.particles[i]);
        }
    }

    weight(){
        for(let i = 0; i < this.n; i++){
            const part = this.particles[i];
            const measurement = this.#measurement_potential(part, this.state);
            this.weights[i] = measurement;
            // TODO (kisailus) -- Incorporate context measurement
        }
        
        // Normalize
        const weight_sum = this.weights.reduce((partialSum, a) => partialSum + a, 0);
        for (let k = 0; k < this.n; k++){
            this.weights[k] /= weight_sum;
        }
    }

    #measurement_potential(particle, state){
        var potential = 0;
        var idx = 0;
        // determine which object action is most likely near
        if(this.preconditions[0] != 'None'){
            for(let i = 0; i < this.preconditions.length; i++){
                if(!state.includes(this.preconditions[i])){
                    break;
                }else{
                    idx++;
                }
            }
        }
        var core_elem_weight_modifier = 1;
        while(idx < this.frame_elems_filters.length){
            const core_elem_filter = this.frame_elems_filters[idx];
            for(let i = 0; i < core_elem_filter.particles.length; i++){
                const other_part = core_elem_filter.particles[i];
                var x_dist = Math.pow(other_part.x - particle.x, 2);
                var y_dist = Math.pow(other_part.y - particle.y, 2);
                var z_dist = Math.pow(other_part.z - particle.z, 2);
                var dist = Math.sqrt(x_dist + y_dist + z_dist);
                var phi = Math.exp(-1 * dist);
                potential += ((1/core_elem_weight_modifier)*(phi * core_elem_filter.weights[i]));
            }
            idx++;
            core_elem_weight_modifier++;
        }
        return potential;
    }

    #context_potential(particle, state){
        // Frame near the next precondition to be completed
        var potential = 1;
        var idx = 0;
        if(this.preconditions[0] != 'None'){
            for(let i = 0; i < this.preconditions.length; i++){
                if(!state.include(this.preconditions[i])){
                    break;
                }else{
                    idx++;
                }
            }
        }

        const precondition_filter = this.precondition_filters[idx];
        for(let i = 0; i < core_elem_filter.particles.length; i++){
            const other_part = core_elem_filter.particles[i];
            var x_dist = Math.pow(other_part.x - particle.x, 2);
            var y_dist = Math.pow(other_part.y - particle.y, 2);
            var z_dist = Math.pow(other_part.z - particle.z, 2);
            var dist = Math.sqrt(x_dist + y_dist + z_dist);
            var phi = Math.exp(-1 * dist);
            if(phi >= 0.5){
                potential += core_elem_filter.weights[i];
            }
        }
        return potential;
    }
}

class ObjectParticleFilter extends ParticleFilter{
    constructor(n, label, valid_regions, color){
        super(n, valid_regions, color, 'sphere');
        this.label = label;
        this.observations = new Array();
        console.log('label: ', this.label, ' rp: ', this.region_reinvig_p);
    }

    add_observation(x, y, z){
        this.observations.push(new StaticObject(x, y, z));
    }

    update_filter(scene){
        super.jitter();
        this.weight();
        this.resample();
    }

    show(scene){
        super.show(scene);
    }

    resample(){
        if(this.observations.length === 0){
            for(let i = 0; i < this.n; i++){
                super.reinvigorate(this.particles[i]);
                this.weights[i] = 1 / this.n;
            }
        }else{
            var num_particles_added = 0;
            // low var resample
            const resample_count = Math.floor(this.n*0.6);
            const resampled_particles = super.low_variance_resample(resample_count);
            for(let i = 0; i < resample_count; i++){
                this.particles[i].update_position(resampled_particles[i].x, resampled_particles[i].y, resampled_particles[i].z)
                num_particles_added++;
            }

            
            // reinvigorate
            const reinvigorate_count = num_particles_added + Math.floor(this.n*0.2);
            for(let i = num_particles_added; i < reinvigorate_count; i++){
                super.reinvigorate(this.particles[i]);
                num_particles_added++;
            }
            
            // rest go to ground truth
            for(let i = num_particles_added; i < this.n; i++){
                const obs = this.observations[i%this.observations.length];
                this.particles[i].update_position(obs.x, obs.y, obs.z);
                super.jitter_particle(this.particles[i]);
            }
            
        }
    }

    weight(){
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
    constructor(x, y, z, color, shape){
        this.x = x;
        this.y = y;
        this.z = z;
        if(shape === 'sphere'){
            this.geometry = new THREE.SphereGeometry(.5);
        }
        if(shape === 'box'){
            this.geometry = new THREE.BoxGeometry(.5, .5, .5); 
        }
        
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