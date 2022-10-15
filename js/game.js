// 카메라 위치 설정
// z 값이 커질 수록, 모니터에 가까워짐,
// y 값이 커질 수록 위로 올라가고
// x 값이 커질 수록 오른쪽으로 간다
let cameraX = 0;
let cameraY = 1500;
let cameraZ = -1000;
// 캐릭터와 캐릭터 애니메이션
let runningCharacter;
let runningAction;

// 애니메이션을 위한 변수
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

// 입력키 매핑
let left = "ArrowLeft";
let up = "ArrowUp";
let right = "ArrowRight";
let p = "p";

let w = "w";
let a = "a";
let s = "s";
let d = "d";

let q = "q";
let e = "e";


let enter = "Enter";

// 중복 키 입력을 방지하기 위한 dictionary
let allowedKeys = {};

// 게임 상태 관리를 위한 변수
let paused = true;
let gameOver;

// 모션을 위한 변수
let motionValue = -60;

// 캐릭터의 모션을 관리하는 클래스
class Character{
    constructor() {
        this.jumpTime = 0.4;
        this.jumpHeight = 1500;
        this.isJumping = false;
        this.isMovingLeft = false;
        this.isMovingRight = false;
        this.currentLane = 0;
        this.queuedMove = [];

    }
    // 이 함수가 캐릭터의 좌, 우, 점프 하는 모션을 관리한다.
    update() {
        let currentTime = new Date() / 1000;
        if (!this.isJumping && !this.isMovingLeft && !this.isMovingLeft && this.queuedMove.length > 0) {
            let move = this.queuedMove.shift();
            if (move === "jump") {
                this.isJumping = true;
                this.jumpStartTime = new Date() / 1000;
            } else if (move === "left") {
                this.isMovingLeft = true;
            }else if (move === "right") {
                this.isMovingRight = true;
            }
        }
        if (this.isJumping) {
            let jumpTimer = currentTime - this.jumpStartTime;
            runningAction.stop();

            if (jumpTimer > this.jumpTime) {
                runningCharacter.position.y = 0;
                this.isJumping = false;
                runningAction.play();
            } else {
                runningCharacter.position.y = this.jumpHeight * Math.sin(
                    (1 / this.jumpTime) * Math.PI * jumpTimer
                )
            }
        }else if (this.isMovingLeft) {
            runningCharacter.position.x -= 200;
            let offset = this.currentLane * 800 - runningCharacter.position.x;
            if (offset > 800) {
                this.currentLane -= 1;
                runningCharacter.position.x = this.currentLane * 800;
                this.isMovingLeft = false;
            }
        }else if (this.isMovingRight) {
            runningCharacter.position.x += 200;
            let offset = runningCharacter.position.x - this.currentLane * 800;
            if (offset > 800) {
                this.currentLane += 1;
                runningCharacter.position.x = this.currentLane * 800;
                this.isMovingRight = false;
            }
        }
    }
}

let characterManager = new Character();
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
        60, world.clientWidth / world.clientHeight, 1, 57000);

    //camera.position.set(0, 1500, -1000);
    camera.position.set(cameraX, cameraY, cameraZ);
    camera.lookAt(new THREE.Vector3(0, 600, -5000));
    window.camera = camera;

    // 광원추가하기
    let light = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    scene.add(light);


    // 캐릭터 렌더링하기
    // TODO: 무슨 캐릭터 쓸지 결정하기, character, mei, moon_walk, walking_robot 중 하나 선정해야된다, 어몽어스로 진행
    // TODO: 캐릭터 점프, 레인 변경 모션 구현
    const loader = new THREE.GLTFLoader();
    loader.load('./character/scene.gltf', function(gltf){
        let running = gltf.scene.children[0];
        // 캐릭터 크기 설정
        running.scale.set(1.5,-4,1.5);
        // 캐릭터 위치 설정
        running.position.set(0,0,-4000);
        scene.add(gltf.scene);
        runningCharacter = running;
        mixer = new THREE.AnimationMixer( gltf.scene );
        runningAction = mixer.clipAction(gltf.animations[0]);
        // runningAction.play();
    }, undefined, function (error) {
        console.error(error);
    });

    // ground 설정하기
    let ground = createGround(4000, 20, 120000, Colors.olive, 0, -400, -60000);
    scene.add(ground);
    // 장애물 & 오브젝트 만들기
    // TODO: 장애물 어떻게 만들어질지 정해야될듯

    // 사용자로부터 입력받을 수 있게 설정
    document.addEventListener('keydown', function (ev) {
        let inputKey = ev.key;
        console.log(inputKey);
        // keydown이 되면 다시 그 입력을 처리하지 않게 false처리, keyup에서 true로 변경해준다.
        if (allowedKeys[inputKey] !== false) {
            allowedKeys[inputKey] = false;
        }
        if (paused && inputKey === enter) {
            document.getElementById("variable-content").style.visibility = "hidden";
            document.getElementById("controls").style.display = "none";
            runningAction.play();
            paused = false;
        } else {
            if (inputKey === p) {
                paused = true;
                // character.onPause();
                document.getElementById(
                    "variable-content").style.visibility = "visible";
                document.getElementById(
                    "variable-content").innerHTML =
                    "Game is paused. Press enter to resume.";
                runningAction.stop();
            }
            if (inputKey === up && !paused) {
                characterManager.queuedMove.push("jump");
            }
            if (inputKey === left && !paused) {
                characterManager.queuedMove.push("left");
            }
            if (inputKey === right && !paused) {
                characterManager.queuedMove.push("right");
            }
        }

    });

    document.addEventListener(
        'keyup',
        function(e) {
            allowedKeys[e.key] = true;
        }
    );
    document.addEventListener(
        'focus',
        function(e) {
            allowedKeys = {};
        }
    )
    animate();

    // 시각화하는 함수
    function animate() {
        characterManager.update();
        let delta = clock.getDelta();
        if ( mixer ) mixer.update( delta );
        renderer.render(scene,camera);
        requestAnimationFrame(animate);
    }

    // lane 만드는 function
    function createGround(dx, dy, dz, map, x, y, z, notFlatShading) {

        const loader = new THREE.TextureLoader();

        const materials = [
            new THREE.MeshBasicMaterial({map: loader.load('https://images.pexels.com/photos/13644281/pexels-photo-13644281.jpeg')}),
            new THREE.MeshBasicMaterial({map: loader.load('https://images.pexels.com/photos/13644281/pexels-photo-13644281.jpeg')}),
            new THREE.MeshBasicMaterial({map: loader.load('https://images.pexels.com/photos/13644281/pexels-photo-13644281.jpeg')}),
            new THREE.MeshBasicMaterial({map: loader.load('https://images.pexels.com/photos/13644281/pexels-photo-13644281.jpeg')}),

        ];

        let geom = new THREE.BoxGeometry(dx, dy, dz);

        let box = new THREE.Mesh(geom, materials);

        box.castShadow = true;
        box.receiveShadow = true;
        box.position.set(x, y, z);
        return box;
    }

};

