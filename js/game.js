// 카메라 위치 설정
// z 값이 커질 수록, 모니터에 가까워짐,
// y 값이 커질 수록 위로 올라가고
// x 값이 커질 수록 오른쪽으로 간다

// 디폴트 카메라 위치
const defaultX = 0;
const defaultY = 1500;
const defaultZ = -1000;

// 카메라 x,y,z 값을 조정하기 위한 변수
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
const left = "ArrowLeft";
const up = "ArrowUp";
const right = "ArrowRight";
const p = "p";

const w = "w";
const a = "a";
const s = "s";
const d = "d";

const q = "q";
const e = "e";

const enter = "Enter";

const one = "1";
const two = "2";
const three = "3";
const four = "4";
const five = "5";
const six = "6";
const seven = "7";

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
    // animate 함수 안에서 반복적으로 호출되면서 캐릭터 레인 이동, 점프 모션을 보여주는 함수
    update() {
        // 점프할때 점프종료 시간을 구하기 위해 currentTime 계산
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
                // 캐릭터의 점프 높이를 sin함수를 통해서 계산,0->1->0
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
// 캐릭터 관리 객체 생성
let characterManager = new Character();

// 카메라 변수
let camera;

class Camera {
    constructor() {
        this.currentView = 7;
        this.viewChangeTime = 0.5;
        // 카메라 x값 좌우로 변경
        this.changingToOne = false;
        this.changingToTwo = false;
        // 카메라 y값 위아래로 변경
        this.changingToThree = false;
        this.changingToFour = false;
        // 카메라 z값 가까이 멀리 변경
        this.changingToFive = false;
        this.changingToSix = false;
        // 디폴트 카메라 세팅으로 변경
        this.changingToSeven = false;
        this.queuedChange = [];


        this.xDiff = 1000;
        this.yDiff = 1000;
        this.zDiff = 1000;
    }

    changeDone(finalView) {
        this.currentView = finalView;
        camera.position.x = this.newX;
        camera.position.y = this.newY;
        camera.position.z = this.newZ;
    }

    changing(timeDiff) {
        camera.position.x = this.pastX + (this.newX - this.pastX)*(timeDiff / this.viewChangeTime);
        camera.position.y = this.pastY + (this.newY - this.pastY)*(timeDiff / this.viewChangeTime);
        camera.position.z = this.pastZ + (this.newZ - this.pastZ)*(timeDiff / this.viewChangeTime);
    }

    update() {
        let curTime = new Date() / 1000;
        if (!this.changingToOne && !this.changingToTwo && !this.changingToThree && !this.changingToFour && !this.changingToFive && !this.changingToSix && !this.changingToSeven && this.queuedChange > 0) {
            let change = this.queuedChange.shift();
            this.changeStartTime = new Date() / 1000;


            this.pastX = camera.position.x;
            this.pastY = camera.position.y;
            this.pastZ = camera.position.z;

            if (change === one && this.currentView !== 1) {
                this.changingToOne = true;
                console.log("changing to one true in update1");
                this.newX = -this.xDiff;
                this.newY = defaultY;
                this.newZ = defaultZ;
            }else if (change === two && this.currentView !== 2) {
                this.changingToTwo = true;

                this.newX = this.xDiff;
                this.newY = defaultY;
                this.newZ = defaultZ;
            }else if (change === three && this.currentView !== 3) {
                this.changingToThree = true;

                this.newX = defaultX;
                this.newY = defaultY + this.yDiff;
                this.newZ = defaultZ;
            }else if (change === four && this.currentView !== 4) {
                this.changingToFour = true;

                this.newX = defaultX;
                this.newY = defaultY - this.yDiff;
                this.newZ = defaultZ;
            }else if (change === five && this.currentView !== 5) {
                this.changingToFive = true;

                this.newX = defaultX;
                this.newY = defaultY;
                this.newZ = defaultZ - this.zDiff;
            }else if (change === six && this.currentView !== 6) {
                this.changingToSix = true;

                this.newX = defaultX;
                this.newY = defaultY;
                this.newZ = defaultZ + this.zDiff;
            }else if (change === seven && this.currentView !== 7) {
                this.changingToSeven = true;

                this.newX = defaultX;
                this.newY = defaultY;
                this.newZ = defaultZ;
            }

        }

        if (this.changingToOne) {
            console.log("changing to one true in update2");
            let timeDiff = curTime - this.changeStartTime;
            if (timeDiff > this.viewChangeTime) {
                this.changeDone(1);
                this.changingToOne = false;
            } else {
                console.log("changing to one true in update3");
                this.changing(timeDiff)
            }
        }else if (this.changingToTwo) {
            let timeDiff = curTime - this.changeStartTime;
            if (timeDiff > this.viewChangeTime) {
                this.changeDone(2);
                this.changingToTwo = false;
            } else {
                this.changing(timeDiff)
            }
        }else if (this.changingToThree) {
            let timeDiff = curTime - this.changeStartTime;
            if (timeDiff > this.viewChangeTime) {
                this.changeDone(3);
                this.changingToThree = false;
            } else {
                this.changing(timeDiff)
            }
        }else if (this.changingToFour) {
            let timeDiff = curTime - this.changeStartTime;
            if (timeDiff > this.viewChangeTime) {
                this.changeDone(4);
                this.changingToFour = false;
            } else {
                this.changing(timeDiff)
            }
        }else if (this.changingToFive) {
            let timeDiff = curTime - this.changeStartTime;
            if (timeDiff > this.viewChangeTime) {
                this.changeDone(5);
                this.changingToFive = false;
            } else {
                this.changing(timeDiff)
            }
        }else if (this.changingToSix) {
            let timeDiff = curTime - this.changeStartTime;
            if (timeDiff > this.viewChangeTime) {
                this.changeDone(6);
                this.changingToSix = false;
            } else {
                this.changing(timeDiff)
            }
        }else if (this.changingToSeven) {
            let timeDiff = curTime - this.changeStartTime;
            if (timeDiff > this.viewChangeTime) {
                this.changeDone(7);
                this.changingToSeven = false;
            } else {
                this.changing(timeDiff)
            }
        }
    }
}

let cameraManager = new Camera();

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
    camera = new THREE.PerspectiveCamera(
        60, world.clientWidth / world.clientHeight, 1, 57000);

    //camera.position.set(0, 1500, -1000);
    camera.position.set(cameraX, cameraY, cameraZ);
    camera.lookAt(new THREE.Vector3(0, 600, -5000));
    window.camera = camera;

    // 광원추가하기
    let light = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    scene.add(light);


    // 캐릭터 렌더링하기
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

    // 시점 변화 애니메이션 추가해보기

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
            if (inputKey === one && !paused) {
                cameraManager.queuedChange.push(one);
            }
            if (inputKey === two && !paused) {
                cameraManager.queuedChange.push(two);
            }
            if (inputKey === three && !paused) {
                cameraManager.queuedChange.push(three);
            }
            if (inputKey === four && !paused) {
                cameraManager.queuedChange.push(four);
            }
            if (inputKey === five && !paused) {
                cameraManager.queuedChange.push(five);
            }
            if (inputKey === six && !paused) {
                cameraManager.queuedChange.push(six);
            }
            if (inputKey === seven && !paused) {
                cameraManager.queuedChange.push(seven);
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
        cameraManager.update();
        console.log(camera.position.x + " " + camera.position.y + " " + camera.position.z);
        // camera.position.set(cameraX, cameraY, cameraZ);
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

