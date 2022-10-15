// 카메라 위치 설정
// z 값이 커질 수록, 모니터에 가까워짐,
//
let cameraX = 0;
let cameraY = 1500;
let cameraZ = -1000;

let runningCharacter;
let runningAction;

let clock = new THREE.Clock();
let mixer;

let Colors = {
    cherry: 0xe35d6a,
    blue: 0x1560bd,
    white: 0xd8d0d1,
    black: 0x000000,
    brown: 0x654321,
    peach: 0xffdab9,
    yellow: 0xffff00,
    olive: 0x556b2f,
    grey: 0x696969,
    sand: 0x835c3b,
    brownDark: 0x23190f,
    green: 0x669900,
    grass: 0xE5D85C
};
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

    //camera.position.set(0, 1500, -1000);
    camera.position.set(cameraX, cameraY, cameraZ);
    camera.lookAt(new THREE.Vector3(0, 600, -5000));
    window.camera = camera;

    // 광원추가하기
    let light = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    scene.add(light);


    // 캐릭터 렌더링하기
    // TODO: 무슨 캐릭터 쓸지 결정하기, character, mei, moon_walk, walking_robot 중 하나 선정해야된다
    const loader = new THREE.GLTFLoader();
    loader.load('./mei/scene.gltf', function(gltf){
        running = gltf.scene.children[0];
        // 캐릭터 크기 설정
        running.scale.set(5,-5,5);
        // 캐릭터 위치 설정
        running.position.set(0,0,-4000);
        scene.add(gltf.scene);
        runningCharacter = running;
        mixer = new THREE.AnimationMixer( gltf.scene );
        runningAction = mixer.clipAction(gltf.animations[0]);
        runningAction.play();
    }, undefined, function (error) {
        console.error(error);
    });

    // ground 설정하기
    let ground = createGround(3000, 20, 120000, Colors.olive, 0, -400, -60000);
    scene.add(ground);
    // 장애물 & 오브젝트 만들기
    // TODO: 장애물 어떻게 만들어질지 정해야될듯

    animate();


    function animate() {
        let delta = clock.getDelta();
        if ( mixer ) mixer.update( delta );
        renderer.render(scene,camera);
        requestAnimationFrame(animate);
    }

    function createGround(dx, dy, dz, map, x, y, z, notFlatShading) {

        const loader = new THREE.TextureLoader();

        const materials = [
            new THREE.MeshBasicMaterial({map: loader.load('https://images.pexels.com/photos/13644281/pexels-photo-13644281.jpeg')}),
            new THREE.MeshBasicMaterial({map: loader.load('https://images.pexels.com/photos/13644281/pexels-photo-13644281.jpeg')}),
            new THREE.MeshBasicMaterial({map: loader.load('https://images.pexels.com/photos/13644281/pexels-photo-13644281.jpeg')}),
            new THREE.MeshBasicMaterial({map: loader.load('https://images.pexels.com/photos/13644281/pexels-photo-13644281.jpeg')}),

        ];

        var geom = new THREE.BoxGeometry(dx, dy, dz);

        var box = new THREE.Mesh(geom, materials);

        box.castShadow = true;
        box.receiveShadow = true;
        box.position.set(x, y, z);
        return box;
    }

};