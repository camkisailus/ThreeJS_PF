import * as THREE from '../node_modules/three/build/three.module.js';
import { TrackballControls } from  '../node_modules/three/examples/jsm/controls/TrackballControls.js';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { ObjectParticleFilter, FrameParticleFilter } from './particle.js';
import { Region } from './region.js';
let scene, camera, renderer, controls, obj_pfs, sf_pfs, all_filters, loader, kitchenBox, livingRoomBox, b1, b2, b3, b4, update;

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

    const living_room = new THREE.Mesh(geometry, material);
    living_room.position.z = -12;
    living_room.position.x = -10;
    living_room.position.y = 4;
    livingRoomBox = new THREE.Box3( ).setFromObject(living_room);

    const boxgeometry = new THREE.BoxGeometry(5,10,6);
    const b1cube = new THREE.Mesh( boxgeometry, material );
    b1cube.position.z = -9;
    b1cube.position.x = 7.5;
    b1cube.position.y = 4;
    b1 = new THREE.Box3( ).setFromObject( b1cube );

    const b2cube = new THREE.Mesh( boxgeometry, material );
    b2cube.position.z = -9;
    b2cube.position.x = 2.5;
    b2cube.position.y = 4;
    b2 = new THREE.Box3( ).setFromObject( b2cube );

    const b3cube = new THREE.Mesh( boxgeometry, material );
    b3cube.position.z = -15;
    b3cube.position.x = 7.5;
    b3cube.position.y = 4;
    b3 = new THREE.Box3( ).setFromObject( b3cube );

    const b4cube = new THREE.Mesh( boxgeometry, material );
    b4cube.position.z = -15;
    b4cube.position.x = 2.5;
    b4cube.position.y = 4;
    b4 = new THREE.Box3( ).setFromObject( b4cube );
    

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

    obj_pfs = new Array();
    sf_pfs = new Array();
    all_filters = new Array();

}

function init_particle_filters(){
    var spoon_pf = new ObjectParticleFilter(50, 'spoon', [livingRoomBox, kitchenBox], 0x00ff00);
    obj_pfs.push(spoon_pf);
    all_filters.push(spoon_pf);
    // var mug_pf = new ObjectParticleFilter(50, 'mug', [b1,b4], 0xff0000);
    // obj_pfs.push(mug_pf);
    // all_filters.push(mug_pf);
    // var grasp_spoon_pf = new FrameParticleFilter(50, 'grasp_spoon', [livingRoomBox, kitchenBox]);
    // grasp_spoon_pf.add_frame_elem(spoon_pf, 'spoon');
    // sf_pfs.push(grasp_spoon_pf);
    // all_filters.push(grasp_spoon_pf);

    // var stir_mug_pf = new FrameParticleFilter(50, 'stir_mug', [livingRoomBox, kitchenBox]);
    // stir_mug_pf.add_frame_elem(spoon_pf, 'spoon');
    // stir_mug_pf.add_frame_elem(mug_pf, 'mug');
    // stir_mug_pf.add_precondition(grasp_spoon_pf, 'grasp_spoon');
    // sf_pfs.push(stir_mug_pf);
    // all_filters.push(stir_mug_pf);
    
    for(let i = 0; i < obj_pfs.length; i++){
        obj_pfs[i].show(scene)
    }
    for(let i = 0; i < sf_pfs.length; i++){
        sf_pfs[i].show(scene)
    }
    update = false;
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

document.getElementById("update_filters").addEventListener('click', function(){
    for(let i = 0; i < all_filters.length; i++){
        all_filters[i].jitter();
    }
    for(let i = 0; i < all_filters.length; i++){
        all_filters[i].weight();
    }
    for(let i = 0; i < all_filters.length; i++){
        all_filters[i].resample();
    }
    for(let i = 0; i < all_filters.length; i++){
        all_filters[i].show(scene);
    }
});
document.getElementById("add_observations").addEventListener('click', function(){
    for(let i = 0; i < obj_pfs.length; i++){
        if(obj_pfs[i].label === 'spoon'){
            obj_pfs[i].add_observation(5, 4, -12);
            obj_pfs[i].add_observation(-5, 4, -12);
        }
    }
});

window.addEventListener('resize', onWindowResize, false);
init();
init_particle_filters();
animate();