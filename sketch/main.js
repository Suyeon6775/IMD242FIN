// 종횡비를 고정하고 싶을 경우: 아래 두 변수를 0이 아닌 원하는 종, 횡 비율값으로 설정.
// 종횡비를 고정하고 싶지 않을 경우: 아래 두 변수 중 어느 하나라도 0으로 설정.
const aspectW = 4;
const aspectH = 3;
// html에서 클래스명이 container-canvas인 첫 엘리먼트: 컨테이너 가져오기.
const container = document.body.querySelector('.container-canvas');

// 필요에 따라 이하에 변수 생성.
let capture; // 웹캠 입력 캡처
let gridSize = 20; // 픽셀 크기
let pixels = []; // 픽셀 정보를 저장할 배열
let mic; // 마이크 입력
const clapThreshold = 0.1; // 소리 감지 임계값
let explode = false; // 픽셀 폭발 여부

function setup() {
  // 컨테이너의 현재 위치, 크기 등의 정보 가져와서 객체구조분해할당을 통해 너비, 높이 정보를 변수로 추출.
  const { width: containerW, height: containerH } =
    container.getBoundingClientRect();

  // 종횡비가 설정되지 않은 경우:
  // 컨테이너의 크기와 일치하도록 캔버스를 생성하고, 컨테이너의 자녀로 설정.
  if (aspectW === 0 || aspectH === 0) {
    createCanvas(containerW, containerH).parent(container);
  }
  // 컨테이너의 가로 비율이 설정한 종횡비의 가로 비율보다 클 경우:
  // 컨테이너의 세로길이에 맞춰 종횡비대로 캔버스를 생성하고, 컨테이너의 자녀로 설정.
  else if (containerW / containerH > aspectW / aspectH) {
    createCanvas((containerH * aspectW) / aspectH, containerH).parent(
      container
    );
  }
  // 컨테이너의 가로 비율이 설정한 종횡비의 가로 비율보다 작거나 같을 경우:
  // 컨테이너의 가로길이에 맞춰 종횡비대로 캔버스를 생성하고, 컨테이너의 자녀로 설정.
  else {
    createCanvas(containerW, (containerW * aspectH) / aspectW).parent(
      container
    );
  }

  // 카메라
  capture = createCapture(VIDEO);
  capture.size(width / gridSize, height / gridSize);
  capture.hide();

  // 마이크
  mic = new p5.AudioIn();
  userStartAudio();
  mic.start();

  // 픽셀 초기화
  for (let y = 0; y < capture.height; y++) {
    for (let x = 0; x < capture.width; x++) {
      pixels.push({
        x: x * gridSize,
        y: y * gridSize,
        originalX: x * gridSize,
        originalY: y * gridSize,
        explodedX: random(-width, width), // 폭발 시 X 방향으로 이동할 랜덤 위치
        explodedY: random(-height, height), // 폭발 시 Y 방향으로 이동할 랜덤 위치
        value: 0, //픽셀의 이진법 값 (0 또는 1)
      });
    }
  }

  background(0);
}

function draw() {
  background(0);
  capture.loadPixels();

  // 소리 감지
  const volume = mic.getLevel();
  if (volume > clapThreshold) {
    explode = true; // 폭발 시작
    setTimeout(() => (explode = false), 1000); // 1초 후 폭발 종료
  }

  // 픽셀 렌더
  for (let i = 0; i < pixels.length; i++) {
    const px = pixels[i];
    const x = Math.floor(px.originalX / gridSize);
    const y = Math.floor(px.originalY / gridSize);
    const index = (y * capture.width + x) * 4;

    if (index >= 0 && index < capture.pixels.length) {
      const r = capture.pixels[index];
      const g = capture.pixels[index + 1];
      const b = capture.pixels[index + 2];
      const brightness = (r + g + b) / 3; // 밝기 계산
      const binaryValue = brightness > 128 ? 1 : 0;
      px.value = binaryValue;

      // 소리나면 픽셀 이동
      if (explode) {
        px.x += (px.explodedX - px.x) * 0.1;
        px.y += (px.explodedY - px.y) * 0.1;
      } else {
        px.x += (px.originalX - px.x) * 0.1; // 원위치
        px.y += (px.originalY - px.y) * 0.1;
      }

      // 1이면 흰색, 0이면 검은색
      fill(px.value * 255);
      noStroke();
      rect(px.x, px.y, gridSize, gridSize);

      // 텍스트 출력
      fill(255);
      textSize(10);
      textAlign(CENTER, CENTER);
      text(px.value, px.x + gridSize / 2, px.y + gridSize / 2);
    }
  }
}
