import * as THREE from '../node_modules/three/build/three.module.js';
import { TrackballControls } from  '../node_modules/three/examples/jsm/controls/TrackballControls.js';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { ObjectParticleFilter, FrameParticleFilter } from './particle.js';
import { Region } from './region.js';
let scene, camera, renderer, controls, obj_pfs, sf_pfs, loader, kitchenBox, update;

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

    obj_pfs = new Array();
    sf_pfs = new Array();

}

function parse_sf(fpath){
    console.log("Parsing json at: ", fpath);
    fetch(fpath)
    .then(response => {
    return response.json();
    })
    .then(jsondata =>{
        const sf_name = jsondata.name;
        const valid_regions = jsondata.valid_regions;
        var frame_pf = new FrameParticleFilter(50, sf_name, [kitchenBox]);
        var frame_elems = new Array();
        for(let i = 0; i < jsondata.frame_elements.length; i++){
            if(jsondata.frame_elements[i].is_core){
                frame_elems.push(jsondata.frame_elements[i].name);
            }
        }
        var preconditions = new Array();
        try{
            for(let j = 0; j < jsondata.preconditons.length; j++){
                preconditions.push(jsondata.preconditions[i].name);
            }
        }catch{
            preconditions.push("None");
        }
        frame_pfs.push(frame_pf);
        console.log(frame_pfs);
        // console.log(frame_pf);
    });
    console.log(frame_pfs);
    
}
function init_particle_filters(){
    var spoon_pf = new ObjectParticleFilter(50, 'spoon', [kitchenBox], 0x00ff00);
    obj_pfs.push(spoon_pf);
    var grasp_spoon_pf = new FrameParticleFilter(50, 'grasp_spoon', [kitchenBox])
    grasp_spoon_pf.add_frame_elem(spoon_pf, 'spoon')
    sf_pfs.push(grasp_spoon_pf)
    
    for(let i = 0; i < obj_pfs.length; i++){
        obj_pfs[i].show(scene)
    }
    for(let i = 0; i < sf_pfs.length; i++){
        sf_pfs[i].show(scene)
    }
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
        for(let i = 0; i < obj_pfs.length; i++){
            obj_pfs[i].update_filter(scene);
        }
        for(let i = 0; i < sf_pfs.length; i++){
            sf_pfs[i].update_filter(scene);
        }
        // for(let i = 0; i < sf_pfs.length; i++){
        //     sf_pfs[i].show(scene)
        // }
        
    }
    // pf.show(scene);
    renderer.render(scene, camera);
}


function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

document.getElementById("update_filters").addEventListener('click', function(){
    // pf.update_filter();
    // for(let iters = 0; iters < 1; iters++){
    //     console.log(iters)
    //     for(let i = 0; i < obj_pfs.length; i++){
    //         obj_pfs[i].update_filter(scene);
    //     }
    //     for(let i = 0; i < sf_pfs.length; i++){
    //         sf_pfs[i].update_filter(scene);
    //     }
    // }

    if(update){
        update = false;
    }else{
        update = true;
    }
});
document.getElementById("add_observations").addEventListener('click', function(){
    for(let i = 0; i < obj_pfs.length; i++){
        if(obj_pfs[i].label == 'spoon'){
            obj_pfs[i].add_observation(5, 4, -12);
            obj_pfs[i].add_observation(8, 4, -12);
        }
    }
});

window.addEventListener('resize', onWindowResize, false);
init();
init_particle_filters();
animate();