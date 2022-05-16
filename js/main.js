import * as THREE from '../node_modules/three/build/three.module.js';
import { TrackballControls } from  '../node_modules/three/examples/jsm/controls/TrackballControls.js';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { ParticleFilter } from './particle.js';
import { Region } from './region.js';
let scene, camera, renderer, controls, pf, loader;

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
    // loader = new GLTFLoader();
    // loader.load('../models/centered_apt.glb', function(gltf){
    //     scene.add(gltf.scene);
    // }, undefined, function (error){
    //     console.error(error);
    // });
    // const geometry = new THREE.BoxGeometry(10,10,17);
    // const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    // const cube = new THREE.Mesh( geometry, material );
    // cube.position.z = -12;
    // cube.position.x = 5;
    // const box = new THREE.Box3( ).setFromObject( cube );		 
	// const boxHelper = new THREE.Box3Helper( box, 0xffff00 );
    // scene.add( boxHelper );

    // scene.add( cube );
    // Kitchen:
    //  x: (0, 10)
    //  y: (-5, 5)
    //  z: (-20.5, -3.5)


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
    let kitchen_region = new Region(0, -5, -20.5, 10, 5, -3.5);
    const n = 5;
    pf = new ParticleFilter(n, [kitchen_region], 0.01);
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
    renderer.render(scene, camera);
}

function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

document.getElementById("cam_pose").addEventListener('click', function(){
    console.log(camera.position);
    console.log(camera.rotation);
    // console.log(model.position.x);
});
// document.getElementById("dec_x_rot").addEventListener('click', function(){
//     model.rotation.x -= 0.1;
//     console.log(model.rotation);
//     // console.log(model.position.x);
// });
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