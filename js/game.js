// 카메라 위치 설정
// z 값이 커질 수록, 모니터에 가까워짐,
// y 값이 커질 수록 위로 올라가고
// x 값이 커질 수록 오른쪽으로 간다

// html 캔버스
let world;
// 랜더러 오브젝트
let renderer;

//라운드 종료 확인
let roundOverCheck = false;

// animate을 멈추기 위한 변수
let animation;

// gltf 모델 및 폰트를 띄우게 하기 위한 loader
let loader;
let fontLoader;
let fontURL =
  "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json";
// 디폴트 카메라 위치
const defaultX = 0;
const defaultY = 1500;
const defaultZ = -1000;
// 카메라가 보는 위치의 디폴트 값
const defaultDestX = 0;
const defaultDestY = 600;
const defaultDestZ = -5000;
// 8번 시점을 위한 카메라 세팅 변수
const eightXPosition = 0;
const eightYPosition = 3800;
const eightZPotion = -8000;

const eightXDes = 0;
const eightYDes = -2600;
const eightZDes = -4000;

// 카메라 x,y,z 값을 조정하기 위한 변수
let cameraX = 0;
let cameraY = 1500;
let cameraZ = -1000;
// 캐릭터와 캐릭터 애니메이션
let runningCharacter;
let runningAction;

// 동전 그리고 동전 애니메이션
let coin;
let spinningAction;

// 애니메이션을 위한 변수
let clock = new THREE.Clock();
// 애니메이션 하나당 한개의 믹서가 필요하다
let mixer;
let coinMixer;

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
  grass: 0xe5d85c,
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

const r = "r";
const i = "i";
const v = "v";
const b = "b";

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
const eight = "8";

// 중복 키 입력을 방지하기 위한 dictionary
let allowedKeys = {};

// 게임 상태 관리를 위한 변수
let paused = true;
let gameOver = false;

// 모션을 위한 변수
let motionValue = -60;

// 오브젝트들이 추가될 scene
let scene;

// 캐릭터의 모션을 관리하는 클래스
class Character {
  constructor() {
    // 점프 지속 시간
    this.jumpTime = 0.4;
    // 캐릭터가 점프하는 높이
    this.jumpHeight = 1500;
    this.isJumping = false;
    this.isMovingLeft = false;
    this.isMovingRight = false;
    // 캐릭터의 현재 lane, 중앙 레인이 0, 왼쪽으로 가면 1씩 작아지고, 오른쪽으로 가면 1씩 커짐
    this.currentLane = 0;
    // 사용자의 입력을 저장해 놓고 움직임이 끝나면 바로 다음 모션을 진행하기 위한 큐
    this.queuedMove = [];
  }
  // 이 함수가 캐릭터의 좌, 우, 점프 하는 모션을 관리한다.
  // animate 함수 안에서 반복적으로 호출되면서 캐릭터 레인 이동, 점프 모션을 보여주는 함수
  update() {
    // 점프할때 점프종료 시간을 구하기 위해 currentTime 계산
    let currentTime = new Date() / 1000;
    if (
      !this.isJumping &&
      !this.isMovingLeft &&
      !this.isMovingLeft &&
      this.queuedMove.length > 0
    ) {
      let move = this.queuedMove.shift();
      if (move === "jump") {
        this.isJumping = true;
        this.jumpStartTime = new Date() / 1000;
      } else if (move === "left") {
        this.isMovingLeft = true;
      } else if (move === "right") {
        this.isMovingRight = true;
      }
    }
    if (this.isJumping) {
      let jumpTimer = currentTime - this.jumpStartTime;
      runningAction.stop();

      if (jumpTimer > this.jumpTime) {
        runningCharacter.position.y = 0;
        coin.position.y = 480;
        this.isJumping = false;
        runningAction.play();
      } else {
        // 캐릭터의 점프 높이를 sin함수를 통해서 계산,0->1->0
        runningCharacter.position.y =
          this.jumpHeight * Math.sin((1 / this.jumpTime) * Math.PI * jumpTimer);
        coin.position.y = 480 + runningCharacter.position.y;
      }
    } else if (this.isMovingLeft) {
      runningCharacter.position.x -= 200;
      coin.position.x -= 200;
      let offset = this.currentLane * 800 - runningCharacter.position.x;
      if (offset > 800) {
        this.currentLane -= 1;
        runningCharacter.position.x = this.currentLane * 800;
        coin.position.x = this.currentLane * 800;
        this.isMovingLeft = false;
      }
    } else if (this.isMovingRight) {
      runningCharacter.position.x += 200;
      coin.position.x += 200;
      let offset = runningCharacter.position.x - this.currentLane * 800;
      if (offset > 800) {
        this.currentLane += 1;
        runningCharacter.position.x = this.currentLane * 800;
        coin.position.x = this.currentLane * 800;
        this.isMovingRight = false;
      }
    }
  }
}
// 캐릭터 관리 객체 생성
let characterManager = new Character();

// 동전 애니메이션 관리 클래스
// 동전 이동은 위 캐릭터 관리 클래스에서 하는데
// 동전이 보여졌다가 사라지는 애니메이션을 이 클래스에서 관리한다
class Coin {
  constructor() {
    this.jumpTime = 0.4;
    this.jumpHeight = 500;
    this.isJumping = false;
    this.queuedAction = [];
  }

  update() {
    let currentTime = new Date() / 1000;
    if (!this.isJumping && this.queuedAction.length > 0) {
      this.queuedAction.shift();
      this.isJumping = true;
      this.jumpStartTime = new Date() / 1000;
    }

    if (this.isJumping) {
      let jumpTimer = currentTime - this.jumpStartTime;

      if (jumpTimer > this.jumpTime) {
        coin.position.y = 480 + runningCharacter.position.y;
        coin.visible = false;
        this.isJumping = false;
      } else {
        coin.visible = true;
        coin.position.y =
          480 +
          this.jumpHeight *
            Math.sin((1 / this.jumpTime) * Math.PI * jumpTimer) +
          runningCharacter.position.y;
      }
    }
  }
}

let coinManager = new Coin();

// 카메라 변수
let camera;
// 카메라 관리하기 위한 클래스
class Camera {
  constructor() {
    // 디폴트 뷰가 7번시점이기에 7번으로 고정
    this.currentView = 7;
    // 카메라 위치를 변경하는데 걸릴 시간
    // viewChangeTime이 커지면 카메라 옮기는데 시간이 오래걸림
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
    // 카메라 시점을 완전 변경해서 정면 시점으로 이동
    this.changingToEight = false;
    // 다음 카메라 모션을 저장하기 위한 큐
    this.queuedChange = [];

    // 카메라 위치 변화량
    this.xDiff = 1000;
    this.yDiff = 1000;
    this.zDiff = 1000;

    // 카메라가 보는 지점 위치 변화량
    this.destXDiff = 500;
    this.destYDiff = 500;

    // 현재 카메라가 보고 있는 지점
    // 초기에는 default인 곳을 보고 있으니 default로 매핑
    this.currentDestX = defaultDestX;
    this.currentDestY = defaultDestY;
    this.currentDestZ = defaultDestZ;

    // 화면이 흔들리는데 걸릴 시간
    this.rumbleTime = 0.4;
    this.rumbleQueue = [];
    this.isRumbling = false;
    // 화면이 흔들리는 양, 값을 키우면 더 심하게 흔들림
    this.rDiff = 0.15;
  }
  // 화면 흔드는 이펙트 함수
  rumble() {
    let curTime = new Date() / 1000;
    if (!this.isRumbling && this.rumbleQueue.length > 0) {
      this.rumbleQueue.shift();
      this.rumbleStartTime = curTime;

      this.isRumbling = true;

      this.currentRZ = camera.rotation.z;
    }

    if (this.isRumbling) {
      let rumbleTimer = curTime - this.rumbleStartTime;
      if (rumbleTimer > this.rumbleTime) {
        this.isRumbling = false;
        camera.rotation.z = this.currentRZ;
      } else {
        camera.rotation.z =
          this.currentRZ +
          this.rDiff *
            Math.sin((1 / this.rumbleTime) * 2 * Math.PI * rumbleTimer);
      }
    }
  }

  // timeDiff가 viewChangeTime보다 커지면 실행된다
  // 카메라 위치를 고정
  // 이 코드 없으면 할때마다 위치가 살짝살짝 달라짐
  changeDone(finalView) {
    this.currentView = finalView;
    camera.position.x = this.newX;
    camera.position.y = this.newY;
    camera.position.z = this.newZ;

    this.currentDestX = this.newDestX;
    this.currentDestY = this.newDestY;
    this.currentDestZ = this.newDestZ;

    camera.lookAt(
      new THREE.Vector3(this.currentDestX, this.currentDestY, this.currentDestZ)
    );
  }
  // update안에 호출되는 함수
  // changing이 실행되면서 카메라 위치 값을 변경해준다.
  // timeDiff = 현재 시간 - 카메라 위치를 변경을 시작한 시간 (초단위로 계산되는듯)
  changing(timeDiff) {
    camera.position.x =
      this.pastX + (this.newX - this.pastX) * (timeDiff / this.viewChangeTime);
    camera.position.y =
      this.pastY + (this.newY - this.pastY) * (timeDiff / this.viewChangeTime);
    camera.position.z =
      this.pastZ + (this.newZ - this.pastZ) * (timeDiff / this.viewChangeTime);

    let tempX =
      this.currentDestX +
      (this.newDestX - this.currentDestX) * (timeDiff / this.viewChangeTime);
    let tempY =
      this.currentDestY +
      (this.newDestY - this.currentDestY) * (timeDiff / this.viewChangeTime);
    let tempZ =
      this.currentDestZ +
      (this.newDestZ - this.currentDestZ) * (timeDiff / this.viewChangeTime);

    camera.lookAt(new THREE.Vector3(tempX, tempY, tempZ));
  }
  // 위 characterManager와 동일하게 animate 안에서 반복적으로 호출 되며 카메라 위치를 부드럽게 변경
  update() {
    let curTime = new Date() / 1000;
    if (
      !this.changingToOne &&
      !this.changingToTwo &&
      !this.changingToThree &&
      !this.changingToFour &&
      !this.changingToFive &&
      !this.changingToSix &&
      !this.changingToSeven &&
      !this.changingToEight &&
      this.queuedChange.length > 0
    ) {
      let change = this.queuedChange.shift();
      this.changeStartTime = new Date() / 1000;

      this.pastX = camera.position.x;
      this.pastY = camera.position.y;
      this.pastZ = camera.position.z;

      if (change === one && this.currentView !== 1) {
        this.changingToOne = true;

        this.newX = -this.xDiff;
        this.newY = defaultY;
        this.newZ = defaultZ;

        this.newDestX = this.destXDiff;
        this.newDestY = defaultDestY;
        this.newDestZ = defaultDestZ;
      } else if (change === two && this.currentView !== 2) {
        this.changingToTwo = true;

        this.newX = this.xDiff;
        this.newY = defaultY;
        this.newZ = defaultZ;

        this.newDestX = -this.destXDiff;
        this.newDestY = defaultDestY;
        this.newDestZ = defaultDestZ;
      } else if (change === three && this.currentView !== 3) {
        this.changingToThree = true;

        this.newX = defaultX;
        this.newY = defaultY + this.yDiff;
        this.newZ = defaultZ;

        this.newDestX = defaultDestX;
        this.newDestY = defaultDestY - this.destYDiff;
        this.newDestZ = defaultDestZ;
      } else if (change === four && this.currentView !== 4) {
        this.changingToFour = true;

        this.newX = defaultX;
        this.newY = defaultY - this.yDiff;
        this.newZ = defaultZ;

        this.newDestX = defaultDestX;
        this.newDestY = defaultDestY + this.destYDiff;
        this.newDestZ = defaultDestZ;
      } else if (change === five && this.currentView !== 5) {
        this.changingToFive = true;

        this.newX = defaultX;
        this.newY = defaultY;
        this.newZ = defaultZ - this.zDiff;

        this.newDestX = defaultDestX;
        this.newDestY = defaultDestY;
        this.newDestZ = defaultDestZ;
      } else if (change === six && this.currentView !== 6) {
        this.changingToSix = true;

        this.newX = defaultX;
        this.newY = defaultY;
        this.newZ = defaultZ + this.zDiff;

        this.newDestX = defaultDestX;
        this.newDestY = defaultDestY;
        this.newDestZ = defaultDestZ;
      } else if (change === seven && this.currentView !== 7) {
        this.changingToSeven = true;

        this.newX = defaultX;
        this.newY = defaultY;
        this.newZ = defaultZ;

        this.newDestX = defaultDestX;
        this.newDestY = defaultDestY;
        this.newDestZ = defaultDestZ;
      } else if (change === eight && this.currentView !== 8) {
        this.changingToEight = true;

        this.newX = eightXPosition;
        this.newY = eightYPosition;
        this.newZ = eightZPotion;

        this.newDestX = eightXDes;
        this.newDestY = eightYDes;
        this.newDestZ = eightZDes;
      }
    }

    if (this.changingToOne) {
      let timeDiff = curTime - this.changeStartTime;
      if (timeDiff > this.viewChangeTime) {
        this.changeDone(1);
        this.changingToOne = false;
      } else {
        this.changing(timeDiff);
      }
    } else if (this.changingToTwo) {
      let timeDiff = curTime - this.changeStartTime;
      if (timeDiff > this.viewChangeTime) {
        this.changeDone(2);
        this.changingToTwo = false;
      } else {
        this.changing(timeDiff);
      }
    } else if (this.changingToThree) {
      let timeDiff = curTime - this.changeStartTime;
      if (timeDiff > this.viewChangeTime) {
        this.changeDone(3);
        this.changingToThree = false;
      } else {
        this.changing(timeDiff);
      }
    } else if (this.changingToFour) {
      let timeDiff = curTime - this.changeStartTime;
      if (timeDiff > this.viewChangeTime) {
        this.changeDone(4);
        this.changingToFour = false;
      } else {
        this.changing(timeDiff);
      }
    } else if (this.changingToFive) {
      let timeDiff = curTime - this.changeStartTime;
      if (timeDiff > this.viewChangeTime) {
        this.changeDone(5);
        this.changingToFive = false;
      } else {
        this.changing(timeDiff);
      }
    } else if (this.changingToSix) {
      let timeDiff = curTime - this.changeStartTime;
      if (timeDiff > this.viewChangeTime) {
        this.changeDone(6);
        this.changingToSix = false;
      } else {
        this.changing(timeDiff);
      }
    } else if (this.changingToSeven) {
      let timeDiff = curTime - this.changeStartTime;
      if (timeDiff > this.viewChangeTime) {
        this.changeDone(7);
        this.changingToSeven = false;
      } else {
        this.changing(timeDiff);
      }
    } else if (this.changingToEight) {
      let timeDiff = curTime - this.changeStartTime;
      if (timeDiff > this.viewChangeTime) {
        this.changeDone(8);
        this.changingToEight = false;
      } else {
        this.changing(timeDiff);
      }
    }
  }
}
// 카메라 이동을 위한 객체 생성
let cameraManager = new Camera();

// 오브젝트 관리를 위한 클래스
// TODO: 이 클래스 안에 오브젝트랑 충돌 여부를 판단하는 코드도 들어가야될 것 같다, 충돌 여부 판단하는 코드의 결과를 밑에 게임 매니저가 사용해서 점수를 올리거나 낮추거나 하게하면 될듯
// TODO: 커리큘럼이랑 장애물 분리해서 생성해주는 코드 추가해야함
class Objects {
  constructor() {
    // 관리하는 오브젝트를 저장하는 리스트
    this.objects = [];
    // 현재 만드는 오브젝트의 x,y,z 길이
    this.dx = 500;
    this.dy = 500;
    this.dz = 500;
  }
  // 파라미터로 넘겨받은 x,y,z에 오브젝트를 생성해서 리턴해준다
  createObject(x, y, z) {
    let geo = new THREE.BoxGeometry(this.dx, this.dy, this.dz);
    let mat = new THREE.MeshPhongMaterial({
      color: Colors["olive"],
      flatShading: true,
    });
    let object = new THREE.Mesh(geo, mat);
    object.castShadow = true;
    object.receiveShadow = true;
    object.position.set(x, y, z);
    return object;
  }

  // animate 함수 안에서 반복적으로 호출되며 오브젝트를 움직인다
  update() {
    this.objects.forEach(function (obj) {
      obj.position.z += 100;
    });
    console.log("first" + this.objects.length);
    this.objects = this.objects.filter(function (obj) {
      //의성
      return obj.position.z < 0;
    });

    if (this.objects.length == 0) {
      gameOver = true;
      console.log(roundOverCheck);
    }
  }

  // checkRoundOver() {
  //   this.objects.forEach(function (obj) {
  //     obj.position.z += 100;
  //   });
  //   console.log(roundOverCheck);
  //   this.objects = this.objects.filter(function (obj) {
  //     //의성
  //     return obj.position.z < 0;
  //   });
  //   if (obj == null) {
  //     roundOverCheck = true;
  //     console.log(roundOverCheck);
  //   }
  // }
}

// 오브젝트 관리 객체
let objectManager = new Objects();

// 커리큘럼 생성, 이동을 관리하는 클래스
class Curriculum {
  constructor() {
    // 커리큘럼들을 저장하는 리스트
    this.currs = [];
    // 커리큘럼 글씨들을 저장하는 리스트
    this.currWords = [];

    // 커리큘럼 오브젝트의 크기 변수
    this.dx = 500;
    this.dy = 500;
    this.dz = 500;
  }

  // 커리큘럼 오브젝트 생성
  // 커리큘럼 글씨는 밑에 createCurriculums에서 생성해주고,
  // scene에 추가까지 해준다
  createCurriculum(x, y, z) {
    let geo = new THREE.BoxGeometry(this.dx, this.dy, this.dz);
    let mat = new THREE.MeshPhongMaterial({
      color: Colors["brownDark"],
      flatShading: true,
    });

    let object = new THREE.Mesh(geo, mat);
    object.castShadow = true;
    object.receiveShadow = true;
    object.position.set(x, y, z);
    return object;
  }
  // 커리큘럼 오브젝트를 움직이는 함수
  update() {
    this.currs.forEach(function (obj) {
      obj.position.z += 100;
    });

    this.currWords.forEach(function (obj) {
      obj.position.z += 100;
    });

    this.currs = this.currs.filter(function (obj) {
      return obj.position.z < 0;
    });

    this.currWords = this.currWords.filter(function (obj) {
      return obj.position.z < 0;
    });
  }
}

// 커리큘럼 관리 객체
let currManager = new Curriculum();

// 광원 처리 관리를 위한 클래스
class Light {
  constructor() {
    // 캐릭터 뒷조명
    this.backLight = new THREE.PointLight(0xffffff, 8, 3000, 2);
    // 캐릭터 윗조명
    this.upLight = new THREE.PointLight(0xffffff, 8, 8000, 2);
    // 광원처리를 위한 시간
    this.time = new Date() / 1000;
    // 광원처리 이펙트 루프 시간
    this.loopTime = 4;
    // 커리큘럼을 비추는 스포트라이트 리스트
    this.spotLights = [];
  }

  // 마찬가지로 animate 안에서 반복적으로 실행되며, 광원 처리 효과를 주는 함수
  // 조명 세기를 키우거나 줄이거나 하는 방식으로 일단은 구현해놨음
  // 커리큘럼 오브젝트를 비추는 스포트라이트 이동도 이 메소드에서 실행된다
  update() {
    let curTime = new Date() / 1000;
    let timeDiff = curTime - this.time;

    this.backLight.intensity =
      8 * (Math.abs(Math.sin((1 / this.loopTime) * Math.PI * timeDiff)) + 0.1);
    this.upLight.intensity =
      8 * (Math.abs(Math.sin((1 / this.loopTime) * Math.PI * timeDiff)) + 0.1);

    this.spotLights.forEach(function (obj) {
      obj.position.z += 100;
      obj.target.position.z += 100;
    });

    this.spotLights = this.spotLights.filter(function (obj) {
      return obj.position.z < 0;
    });
  }
}

// 광원처리 관리 객체
let lightManager = new Light();

// 게임 관리를 위한 클래스
// 지속적으로 장애물을 생성하도록 해야될 것 같고, 게임오버, 등 게임 전반적인 프로세스를 클래스
// TODO : 게임 라운드 분리, 난이도 조절 등 코드 추가해야함
class Game {
  constructor() {
    this.score = 0;
  }
  // 충돌 확인하는 메소드
  collisionCheck() {}

  initRound(round) {
    this.round = round;
    let fogDistance = 40000;
    scene.fog = new THREE.Fog(0xbadbe4, 1, fogDistance);

    //camera.position.set(0, 1500, -1000);
    camera.position.set(cameraX, cameraY, cameraZ);
    camera.lookAt(new THREE.Vector3(defaultDestX, defaultDestY, defaultDestZ));
    window.camera = camera;

    // 광원추가하기
    lightManager.backLight.position.set(0, 0, -2000);
    lightManager.upLight.position.set(0, 3000, -4000);
    // hemisphereLight을 쓰면 그냥 그림자도 안생기고 캐릭터의 입체감은 좀 덜하다
    // let light = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    // scene.add(light);
    // 포인트 라이트를 쓰면 촬영장에서 조명킨것처럼 그림자도 생기고, 빛이 덜 가는 부분에 윤곽선도 생겨서 좀 더 입체적으로 보인다
    // 이 상황에서 코드를 실행시켜보면, pointlight를 써서 좌우로 레인을 옮기면 캐릭터가 어두워지는 것을 볼 수 있음,
    scene.add(lightManager.backLight);
    scene.add(lightManager.upLight);

    // TODO: spotlight 처리를 어떻게하면 좋을까, PointLight랑 SpotLight을 섞어서 쓰면 될 것 같기도?

    // 캐릭터 렌더링하기
    loader = new THREE.GLTFLoader();
    loader.load(
      "./character/scene.gltf",
      function (gltf) {
        let running = gltf.scene.children[0];
        // 캐릭터 크기 설정
        running.scale.set(1.5, -4, 1.5);
        // 캐릭터 위치 설정
        running.position.set(0, 0, -4000);
        scene.add(gltf.scene);
        runningCharacter = running;
        mixer = new THREE.AnimationMixer(gltf.scene);
        runningAction = mixer.clipAction(gltf.animations[0]);
        runningAction.play();
      },
      undefined,
      function (error) {
        console.error(error);
      }
    );

    // 이펙트를 위한 동전 랜더링
    loader.load(
      "./coin/scene.gltf",
      function (gltf) {
        let spinning = gltf.scene.children[0];
        // 동전 크기 설정
        spinning.scale.set(10, 10, 10);
        // 캐릭터 위치 설정
        spinning.position.set(0, 480, -4000);
        scene.add(gltf.scene);
        coin = spinning;
        coinMixer = new THREE.AnimationMixer(gltf.scene);
        spinningAction = coinMixer.clipAction(gltf.animations[0]);
        coin.visible = false;
        spinningAction.play();
      },
      undefined,
      function (error) {
        console.log(error);
      }
    );

    // ground 설정하기
    let ground = createGround(4000, 20, 120000, Colors.olive, 0, -400, -60000);
    scene.add(ground);

    // 장애물 & 오브젝트 만들기
    // TODO: 장애물 어떻게 만들어질지 정해야될듯
    for (let i = 10; i < 40; i++) {
      createObjects(i * -3000, 0.2, 0.6, 0.7);
    }

    // 텍스트 표현해보기
    fontLoader = new THREE.FontLoader(); // 폰트를 띄우기 위한 로더
    createWord(0, 0, -8000, "Round " + round, 500);

    // 커리큘럼 객체를 만들고 텍스트까지 매핑
    for (let i = 10; i < 20; i++) {
      createCurriculums(i * -5000, 0.2, 0.6, 0.7);
    }

    if (gameOver == true) {
      this.roundOver();
    }

    //생성 후에 gameOver boolean을 true로 만들어서 roundover 작동시켜야할듯
  }

  roundOver() {
    if (gameOver) {
      fontLoader = new THREE.FontLoader(); // 폰트를 띄우기 위한 로더
      createWord(0, 0, -8000, "gameover ", 500);
      scene.children.forEach(function (obj) {
        console.log(obj);
        scene.remove(obj);
      });
    }
    cancelAnimationFrame(animation);

    // scene.removeAll();
  }

  // 게임을 진행하는 동안 animate 안에서 반복적으로 실행될 함수
  // 여기 안에서 충돌 관리, 라운드 관리, 점수관리를 하면 될 것 같다
  update() {}
}

let gameManager = new Game();
window.onload = function init() {
  // HTML world랑 js 연결하기
  world = document.getElementById("world");
  // Renderer 설정하기
  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
  });

  renderer.setSize(world.clientWidth, world.clientHeight);
  renderer.shadowMap.enabled = true;
  world.appendChild(renderer.domElement);
  // Scene 생성하기
  scene = new THREE.Scene();
  // Camera 생성하기
  camera = new THREE.PerspectiveCamera(
    60,
    world.clientWidth / world.clientHeight,
    1,
    48000
  );

  // 사용자로부터 입력받을 수 있게 설정
  document.addEventListener("keydown", function (ev) {
    let inputKey = ev.key;
    console.log(inputKey);
    // keydown이 되면 다시 그 입력을 처리하지 않게 false처리, keyup에서 true로 변경해준다.
    if (allowedKeys[inputKey] !== false) {
      allowedKeys[inputKey] = false;
    }
    if (paused) {
      if (inputKey === one) {
        gameManager.initRound(1);
      }
      if (inputKey === two) {
        gameManager.initRound(2);
      }
      if (inputKey === three) {
        gameManager.initRound(3);
      }
      if (inputKey === four) {
        gameManager.initRound(4);
      }

      document.getElementById("variable-content").style.visibility = "hidden";
      document.getElementById("controls").style.visibility = "hidden";
      paused = false;
      gameOver = false;
    } else {
      if (inputKey === p) {
        paused = true;
        // character.onPause();
        document.getElementById("variable-content").style.visibility =
          "visible";
        document.getElementById("variable-content").innerHTML =
          "Game is paused. Press enter to resume.";
        runningAction.stop();
        spinningAction.stop();
      }
      // 캐릭터 애니메이션을 위한 인풋 매핑
      if (inputKey === up && !paused) {
        characterManager.queuedMove.push("jump");
      }
      if (inputKey === left && !paused) {
        characterManager.queuedMove.push("left");
      }
      if (inputKey === right && !paused) {
        characterManager.queuedMove.push("right");
      }
      // 시점 변화를 위한 인풋 매핑
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
      if (inputKey === eight && !paused) {
        cameraManager.queuedChange.push(eight);
      }
      // 흔들거리는 이펙트를 위한 인풋 매핑
      if (inputKey === r && !paused) {
        console.log(
          "rotation" +
            camera.rotation.x +
            " " +
            camera.rotation.y +
            " " +
            camera.rotation.z
        );
        cameraManager.rumbleQueue.push(r);
      }
      if (inputKey === i && !paused) {
        coinManager.queuedAction.push(i);
      }
      if (inputKey === v && !paused) {
        document.getElementById("variable-content").style.visibility =
          "visible";
        document.getElementById("controls").style.visibility = "visible";
        document.getElementById("variable-content").innerHTML =
          "Press 1~4 to select a round and begin";
        // gameManager.initRound();
        gameOver = true;
        paused = true;
        // gameManager.roundOver();
      }
    }
  });

  document.addEventListener("keyup", function (e) {
    allowedKeys[e.key] = true;
  });
  document.addEventListener("focus", function (e) {
    allowedKeys = {};
  });

  animate();
  // 시각화하는 함수
  function animate() {
    characterManager.update();
    coinManager.update();
    cameraManager.update();
    cameraManager.rumble();
    gameManager.roundOver();
    if (!paused) {
      objectManager.update();
      // objectManager.checkRoundOver();
      currManager.update();
      lightManager.update();
    }
    let delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    if (coinMixer) coinMixer.update(delta);
    renderer.render(scene, camera);
    animation = requestAnimationFrame(animate);
  }
};

// lane 만드는 function
function createGround(dx, dy, dz, map, x, y, z, notFlatShading) {
  const loader = new THREE.TextureLoader();

  const materials = [
    new THREE.MeshBasicMaterial({
      map: loader.load(
        "https://images.pexels.com/photos/13644281/pexels-photo-13644281.jpeg"
      ),
    }),
    new THREE.MeshBasicMaterial({
      map: loader.load(
        "https://images.pexels.com/photos/13644281/pexels-photo-13644281.jpeg"
      ),
    }),
    new THREE.MeshBasicMaterial({
      map: loader.load(
        "https://images.pexels.com/photos/13644281/pexels-photo-13644281.jpeg"
      ),
    }),
    new THREE.MeshBasicMaterial({
      map: loader.load(
        "https://images.pexels.com/photos/13644281/pexels-photo-13644281.jpeg"
      ),
    }),
  ];

  let geom = new THREE.BoxGeometry(dx, dy, dz);

  let box = new THREE.Mesh(geom, materials);

  box.castShadow = true;
  box.receiveShadow = true;
  box.position.set(x, y, z);
  return box;
}
// 첫번째 파라미터인 Position이 오브젝트가 그려질 z 축 값을 정한다. 두번째 파라미터 probability가 커질 수록 오브젝트가 더 많이 그려질듯
function createObjects(position, probability, minScale, maxScale) {
  for (let lane = -2; lane <= 2; lane++) {
    let randomNum = Math.random();
    if (randomNum < probability) {
      let scale = minScale + (maxScale - minScale) * Math.random();
      let object = objectManager.createObject(lane * 800, -400, position);
      objectManager.objects.push(object);
      scene.add(object);
    }
  }
}
// 오브젝트를 생성하는 코드랑 비슷하게, 커리큘럼 오브젝트를 생성하는 코드
function createCurriculums(position, probability, minScale, maxScale) {
  for (let lane = -2; lane <= 2; lane++) {
    let randomNum = Math.random();
    if (randomNum < probability) {
      let scale = minScale + (maxScale - minScale) * Math.random();

      let object = currManager.createCurriculum(lane * 800, -400, position);
      currManager.currs.push(object);
      scene.add(object);
      createSpotLight(lane * 800, 100, position);
      createWord(lane * 800, 100, position, "test Curr", 100);
    }
  }
}
// createCurriculums에서 불리는 함수로, 생성된 커리큘럼 오브젝트 위에 글씨 만드는 코드
function createWord(x, y, position, text, fontSize) {
  fontLoader.load(fontURL, (font) => {
    // 쓸 글씨
    let fontGeo = new THREE.TextGeometry(text, {
      font: font,
      size: fontSize, // 글씨 크기
      height: 100, // 글씨 두께
      curveSegments: 12,
    });
    // 효과를 위한 코드
    fontGeo.computeBoundingBox();
    let xMid = -0.5 * (fontGeo.boundingBox.max.x - fontGeo.boundingBox.min.x);
    fontGeo.translate(xMid, 0, 0);
    // 글씨 색 지정
    let fontMat = new THREE.MeshBasicMaterial({
      color: 0x5f9df7,
      wireframe: true,
    });
    // 글씨 오브젝트 생성
    let textMesh = new THREE.Mesh(fontGeo, fontMat);
    // 글씨 위치 지정
    textMesh.position.set(x, y, position);
    // 씬에 추가
    scene.add(textMesh);
    currManager.currWords.push(textMesh);
  });
}
// createCurriculum에서 불리는 함수로, 커리큘럼 오브젝트에 스포트라이트 추가하는 코드
function createSpotLight(x, y, position) {
  let spotLight = new THREE.SpotLight();
  // y좌표가 5000이니까 위에서 아래로 스포트라이트가 향하게 설정
  spotLight.position.set(x, 5000, position);
  // 조명 강도
  spotLight.intensity = 8;
  // 이 값을 줄이면 스포트라이트의 원이 커진다
  spotLight.angle = Math.PI / 30;
  spotLight.target.position.set(x, y, position);
  scene.add(spotLight.target);
  scene.add(spotLight);
  lightManager.spotLights.push(spotLight);
}
