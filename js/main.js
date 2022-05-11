import * as THREE from '../node_modules/three/build/three.module.js';
import { TrackballControls } from '../node_modules/three/examples/jsm/controls/TrackballControls.js';
import {ParticleFilter} from './particle.js'

let scene, camera, renderer, controls, pf;


function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    renderer = new THREE.WebGLRenderer({antialias: true});

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    const n = 10;
    pf = new ParticleFilter(n, 0.01);
    for(let i = 0; i < n; i++){
        pf.particles[i].show(scene);
    }
    for(let i = 0; i < pf.observations.length; i++){
        pf.observations[i].show(scene);
    }
    // for(let i=0; i < n; i++){
    //     scene.add(pf.particles[i].mesh)
    //     scene.add(pf.observations[0].mesh)
    // }

    // cube = new Particle(0, 0, 0);
    // cube2 = new Particle(1, 0, 0);
    // scene.add(cube2.mesh);
    // scene.add(cube.mesh);
    controls = new TrackballControls( camera, renderer.domElement );
    controls.target.set( 0, 0, 0 );
}

function animate(){
    requestAnimationFrame(animate);
    controls.update();
    // pf.update_filter();
    renderer.render(scene, camera);
}

function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

document.getElementById("step_filter_update").addEventListener('click', function(){
    console.log("Clicked!")
    pf.update_filter();
});

window.addEventListener('resize', onWindowResize, false);
init();
animate();