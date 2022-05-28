import * as THREE from '../node_modules/three/build/three.module.js';
import { TrackballControls } from  '../node_modules/three/examples/jsm/controls/TrackballControls.js';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { ObjectParticleFilter } from './particle.js';
import { Region } from './region.js';
let scene, camera, renderer, controls, pf, loader, kitchenBox, update;

function init() {
    // Init Scene and Controls
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.x = -23.07175289479222;
    camera.position.y = 41.169479114395514;
    camera.position.z = -24.941857823187274;
    camera.rotation._x = -2.144220501675071;
    camera.rotation._y = -0.4663662532425442;
    camera.rotation._z = -2.487757754901067;
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    controls = new TrackballControls( camera, renderer.domElement );
    controls.target.set( 1,1,1);

    // Load GLTF model
    loader = new GLTFLoader();
    loader.load('../models/centered_apt.glb', function(gltf){
        scene.add(gltf.scene);
    }, undefined, function (error){
        console.error(error);
    });
    const geometry = new THREE.BoxGeometry(10,10,12);
    const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    const cube = new THREE.Mesh( geometry, material );
    cube.position.z = -12;
    cube.position.x = 5;
    cube.position.y = 4;
    kitchenBox = new THREE.Box3( ).setFromObject( cube );

    // Init Ambient Light
    const ambientLight = new THREE.AmbientLight();
    scene.add(ambientLight);

    // // Init Ground Plane
    const planeSize = 100;
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
    mesh.position.y -= 1;
    scene.add(mesh);
    const axesHelper = new THREE.AxesHelper( 5 );
    scene.add( axesHelper );
}
function init_particle_filters(){
    const n = 50;
    pf = new ObjectParticleFilter(n, 'foo', [kitchenBox]);
    pf.show(scene);
    update = false;
}

// function reset_particle_filters(){
//     for(let i = 0; i < pf.particles.length; i++){
//         scene.remove(pf.particles[i]);
//         pf.particles[i].geometry.dispose();
//         pf.particles[i].material.dispose();
//         pf.particles[i] = undefined; //
//     }
//     for(let i = 0; i < pf.observations.length; i++){
//         scene.remove(pf.observations[i]);
//         pf.observations[i].geometry.dispose();
//         pf.observations[i].material.dispose();
//         pf.observations[i] = undefined; //
//     }
// }

function animate(){
    requestAnimationFrame(animate);
    controls.update();
    if(update){
        pf.update_filter();
    }
    pf.show(scene);
    renderer.render(scene, camera);
}


function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

document.getElementById("update_filters").addEventListener('click', function(){
    // pf.update_filter();
    if(update){
        update = false;
    }else{
        update = true;
    }
});
document.getElementById("add_observations").addEventListener('click', function(){
    pf.add_observation(5, 4, -12);
    pf.add_observation(8,4, -12);
});
// document.getElementById("inc_y_pos").addEventListener('click', function(){
//     model.position.x += 0.5;
//     console.log(model.position);
//     // console.log(model.position.x);
// });
// document.getElementById("dec_y_pos").addEventListener('click', function(){
//     model.position.x -= 0.5;
//     console.log(model.position);
//     // console.log(model.position.x);
// });
// document.getElementById("inc_z_pos").addEventListener('click', function(){
//     model.position.y += 0.5;
//     console.log(model.position);
//     // console.log(model.position.x);
// });
// document.getElementById("dec_z_pos").addEventListener('click', function(){
//     model.position.y -= 0.5;
//     console.log(model.position);
//     // console.log(model.position.x);
// });

window.addEventListener('resize', onWindowResize, false);
init();
init_particle_filters();
animate();