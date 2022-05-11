import * as THREE from '../node_modules/three/build/three.module.js';
import { TrackballControls } from  '../node_modules/three/examples/jsm/controls/TrackballControls.js';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import {ParticleFilter} from './particle.js'
let scene, camera, renderer, controls, pf, loader;

function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    renderer = new THREE.WebGLRenderer({antialias: true});
    controls = new TrackballControls( camera, renderer.domElement );
    controls.target.set( 0, 0, 0 );

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

}
function init_model(){
    loader = new GLTFLoader();

    loader.load('../models/apartment/scene.gltf', function(gltf){
        scene.add(gltf.scene);
    }, undefined, function (error){
        console.error(error);
    });
    const spotLight = new THREE.SpotLight( 0xffffff );
    spotLight.intensity = 10;
    spotLight.position.set( 1000, 1000, 1000 );
    scene.add( spotLight );

    const planeSize = 40;

    const texture_loader = new THREE.TextureLoader();
    const texture = texture_loader.load('https://r105.threejsfundamentals.org/threejs/resources/images/checker.png');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    const repeats = planeSize / 2;
    texture.repeat.set(repeats, repeats);

    const planeGeo = new THREE.PlaneBufferGeometry(planeSize, planeSize);
    const planeMat = new THREE.MeshPhongMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(planeGeo, planeMat);
    mesh.rotation.x = Math.PI * -.5;
    scene.add(mesh);
}
function init_particle_filters(){
    const n = 500;
    pf = new ParticleFilter(n, 0.01);
    for(let i = 0; i < n; i++){
        pf.particles[i].show(scene);
    }
    for(let i = 0; i < pf.observations.length; i++){
        pf.observations[i].show(scene);
    }
    for(let i=0; i < n; i++){
        scene.add(pf.particles[i].mesh)
        scene.add(pf.observations[0].mesh)
    }

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

// document.getElementById("step_filter_update").addEventListener('click', function(){
//     pf.update_filter();
// });

window.addEventListener('resize', onWindowResize, false);
init();
init_model();
animate();