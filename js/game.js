let cameraX = 0;
let cameraY = 1500;
let cameraZ = -1000;

let runningCharacter;
let runningAction;

let clock = new THREE.Clock();
let mixer;
window.onload = function init() {
    // HTML world랑 js 연결하기
    let world = document.getElementById('world');
    // Renderer 설정하기
    let renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
    });

    renderer.setSize(world.clientWidth, world.clientHeight);
    renderer.shadowMap.enabled = true;
    world.appendChild(renderer.domElement);
    
    // Scene 생성하기
    let scene = new THREE.Scene();
    let fogDistance = 40000;
    scene.fog = new THREE.Fog(0xbadbe4, 1, fogDistance);

    // Camera 생성하기
    let camera = new THREE.PerspectiveCamera(
        60, world.clientWidth / world.clientHeight, 1, 120000);

    //camera.position.set(0, 1500, -2000);
    camera.position.set(cameraX, cameraY, cameraZ);
    camera.lookAt(new THREE.Vector3(0, 600, -5000));
    window.camera = camera;

    // 광원추가하기
    let light = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    scene.add(light);

    const loader = new THREE.GLTFLoader();
    loader.load('./character/scene.gltf', function(gltf){
        running = gltf.scene.children[0];
        running.scale.set(1,1,1);
        running.position.set(0,0,-4000);
        scene.add(gltf.scene);
        runningCharacter = running;
        mixer = new THREE.AnimationMixer( gltf.scene );
        runningAction = mixer.clipAction(gltf.animations[0]);
        runningAction.play();
    }, undefined, function (error) {
        console.error(error);
    });

    animate();
    function animate() {
        var delta = clock.getDelta();
        if ( mixer ) mixer.update( delta );
        renderer.render(scene,camera);
        requestAnimationFrame(animate);
    }
};