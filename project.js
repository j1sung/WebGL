const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
  console.error("WebGL 2를 지원하지 않습니다.");
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, canvas.width, canvas.height); // WebGL 뷰포트 갱신
}
resizeCanvas(); // 초기 크기 설정
window.addEventListener("resize", resizeCanvas); // 창 크기 변경 시 캔버스 크기 갱신

// 버텍스 셰이더
const vertexShaderSource = `#version 300 es
in vec4 a_position; // 위치 정보 받아옴
in vec2 a_texcoord; // 텍스쳐 좌표 정보 받아옴 (이미지-2차원 벡터)
uniform mat4 u_matrix; // 변환에 사용되는 행렬
out vec2 v_texcoord; // 텍스쳐는 프래그먼트 셰이더로 넘겨줘야 함

void main() {
  gl_Position = u_matrix * a_position; // 변환 적용
  v_texcoord = a_texcoord; // 텍스쳐 정보를 넘겨줌
}
`;

// 프래그먼트 셰이더
const fragmentShaderSource = `#version 300 es
precision highp float;

in vec2 v_texcoord; // 텍스쳐 좌표(텍셀) 받아옴 -> 색상
uniform sampler2D u_texture; // 텍스쳐 데이터 가져와서 샘플링
uniform vec4 u_color; // 색상
uniform bool u_useColor; // 색상 적용 여부
out vec4 outColor; // 셰이더 최종 색상

void main() {
  if (u_useColor) {
    outColor = u_color; // 랜덤 색상 출력
  } else {
    outColor = texture(u_texture, v_texcoord); // 텍스처 출력
  }
}
`;

// 셰이더 생성 및 컴파일
function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

// 프로그램 생성 및 링크
function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

// 큐브 정점 및 텍스처 좌표 데이터
const positions = new Float32Array([ // 면의 좌표[x, y, z], 텍스쳐 좌표[x, y]
  // Front face
  -0.5, -0.5,  0.5,   0, 1,
   0.5, -0.5,  0.5,   1, 1,
   0.5,  0.5,  0.5,   1, 0,
  -0.5,  0.5,  0.5,   0, 0,

  // Back face
   0.5, -0.5, -0.5,   0, 1,  // 오른쪽 아래
  -0.5, -0.5, -0.5,   1, 1,  // 왼쪽 아래
  -0.5,  0.5, -0.5,   1, 0,  // 왼쪽 위
   0.5,  0.5, -0.5,   0, 0,  // 오른쪽 위

  // Top face
  -0.5,  0.5, 0.5,   0, 0,
  -0.5,  0.5, -0.5,   1, 0,
   0.5,  0.5, -0.5,   1, 1,
   0.5,  0.5, 0.5,   0, 1,

  // Bottom face
  0.5, -0.5, -0.5,   0, 0,
  -0.5, -0.5, -0.5,   1, 0,
  -0.5, -0.5,  0.5,   1, 1,
  0.5, -0.5,  0.5,   0, 1,

  // Right face
   0.5, -0.5, 0.5,   0, 1,
   0.5, -0.5, -0.5,   1, 1,
   0.5,  0.5, -0.5,   1, 0,
   0.5, 0.5,  0.5,   0, 0,

  // Left face
  -0.5, -0.5, -0.5,   0, 1,
  -0.5, -0.5,  0.5,   1, 1,
  -0.5,  0.5,  0.5,   1, 0,
  -0.5,  0.5, -0.5,   0, 0,
]);

const indices = new Uint16Array([ // 삼각형 메쉬
  0,  1,  2,   0,  2,  3,    // front
  4,  5,  6,   4,  6,  7,    // back
  8,  9, 10,   8, 10, 11,    // top
 12, 13, 14,  12, 14, 15,    // bottom
 16, 17, 18,  16, 18, 19,    // right
 20, 21, 22,  20, 22, 23,    // left
]);

// VAO 생성
const vao = gl.createVertexArray();
gl.bindVertexArray(vao);

// 버텍스 버퍼 설정
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

const positionLocation = gl.getAttribLocation(program, "a_position");
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 20, 0);

const texcoordLocation = gl.getAttribLocation(program, "a_texcoord"); // 텍스쳐 변수 받아옴
gl.enableVertexAttribArray(texcoordLocation); // 활성화
gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 20, 12); // 텍스쳐 기본 설정

// 인덱스 버퍼 설정
const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

// 텍스처 설정 함수
function createTexture(imageSrc) { // 텍스쳐 이미지 받아옴
  const texture = gl.createTexture(); // 객체 생성
    // Y축 뒤집기 활성화
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  // 텍스쳐 받아오지 못했을때 기본적인 이미지 색상 설정하는 것
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255])); // 기본 색상

  const image = new Image(); // 이미지 객체 생성
  image.src = imageSrc; // 이미지 소스 연결
  image.onload = () => { // 이미지 로드 함수 (비동기 콜백 함수)
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image); 
    gl.generateMipmap(gl.TEXTURE_2D); // mipmap 자동 생성(중요!한줄!) - 여러 압축 해상도 만들어 거리에 따라 적용
  };
  return texture;
}

// 각 텍스처 로드
const textures = [ // 이미지 가져옴
  createTexture('epic_games.png'),
  createTexture('sketchfab.png'),
  createTexture('quixel.png'),
  createTexture('artstation.png'),
  createTexture('fab.png')
];

// 행렬 설정
const matrixLocation = gl.getUniformLocation(program, "u_matrix");
let viewMatrix = mat4.create();
let projectionMatrix = mat4.create();
mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 20);

// 각 모델의 초기 위치
const initialPositions = [
  [-1.5, -1, -6],
  [1.5, -1, -6],
  [1.5, 1, -6],
  [-1.5, 1, -6],
];

const modelMatrices = [
  mat4.translate(mat4.create(), mat4.create(), initialPositions[0]),
  mat4.translate(mat4.create(), mat4.create(), initialPositions[1]),
  mat4.translate(mat4.create(), mat4.create(), initialPositions[2]),
  mat4.translate(mat4.create(), mat4.create(), initialPositions[3]),
];

const targetPosition = [0, 0, -6]; // 도형들이 이동할 중심 좌표
let isMerging = false; // 스페이스 버튼 눌림 여부
const mergeSpeed = 0.01; // 도형 이동 속도

// 각 모델의 현재 위치
const currentPositions = initialPositions.map(pos => [...pos]);

// 각 모델의 회전 속도를 정의
const rotationSpeeds = [
  [0.01, 0.02, 0],  // X, Y, Z 축 회전 속도
  [0, 0.01, 0.02],
  [0.02, 0, 0.01],
  [0.01, 0.01, 0.01],
];

// 마우스 입력 처리
let yaw = 0; // 좌우 회전
let pitch = 0; // 상하 회전
const sensitivity = 0.005;

canvas.addEventListener("mousemove", (event) => {
  const deltaX = event.movementX || 0;
  const deltaY = event.movementY || 0;

  yaw += deltaX * sensitivity;
  pitch += deltaY * sensitivity;

  // 피치 제한
  pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
});

const center = [0, 0, -6]; // 도형들의 중심 좌표 (x, y, z)
let radius = 10; // 카메라가 중심으로부터의 거리

// 카메라 업데이트 함수
function updateCamera() {
  const cameraPosition = [
    center[0] + radius * Math.cos(pitch) * Math.sin(yaw),
    center[1] + radius * Math.sin(pitch),
    center[2] + radius * Math.cos(pitch) * Math.cos(yaw),
  ];
  mat4.lookAt(viewMatrix, cameraPosition, center, [0, 1, 0]);
}

// 마우스 휠 이벤트로 확대/축소
canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  const zoomSpeed = 0.5; // 확대/축소 속도
  radius += event.deltaY * zoomSpeed * 0.01;

  // 최소 및 최대 거리 제한
  radius = Math.max(2, Math.min(20, radius));
});

// 스페이스 키 이벤트 처리
window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    isMerging = true; // 스페이스 버튼 눌림
  }
});

// 엔터 키 이벤트 처리
window.addEventListener("keydown", (event) => {
  if (event.code === "Enter") {
    location.reload(); // 페이지 새로고침
  }
});

let currentTextureIndex = 4; // 현재 텍스처 인덱스 (병합 후 기본 4번)

// 마우스 좌측 클릭: 0~3번 텍스처 중 랜덤하게 변경
canvas.addEventListener("mousedown", (event) => {
  if (event.button === 0) { // 좌클릭
    currentTextureIndex = Math.floor(Math.random() * 4); // 0~3번 중 랜덤 선택
  } else if (event.button === 2) { // 우클릭
    currentTextureIndex = 4; // 4번 텍스처로 복귀
  }
});

// 우클릭 메뉴 비활성화
canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault(); // 기본 컨텍스트 메뉴 비활성화
});

let isRandomPhase = false; // 랜덤 컬러 여부

// 함수 외부에 고정된 목표 위치를 선언
const TargetPositions = [
  [-1.5, -1, -6], // 원래의 고정된 목표 위치
  [1.5, -1, -6],
  [1.5, 1, -6],
  [-1.5, 1, -6],
];

// 모델 이동 업데이트
function updateModelPositions() {
  if (isMerging) {
    let allMerged = true;

    for (let i = 0; i < currentPositions.length; i++) {
      for (let j = 0; j < 3; j++) { // x, y, z 좌표 각각 처리
        if (Math.abs(currentPositions[i][j] - targetPosition[j]) > 0.01) {
          currentPositions[i][j] += (targetPosition[j] - currentPositions[i][j]) * mergeSpeed;
          allMerged = false;
        }
      }

      // 모델 행렬 업데이트
      mat4.identity(modelMatrices[i]);
      mat4.translate(modelMatrices[i], modelMatrices[i], currentPositions[i]);
    }

    if (allMerged) {
      isMerging = false; // 모두 병합되었으면 멈춤
      isRandomPhase = true; // 랜덤 컬러 시작

      // 병합 후 도형 데이터 삭제
      modelMatrices.length = 0; // 모델 행렬 삭제
      currentPositions.length = 0; // 현재 위치 삭제

      // 새로운 정육면체 행렬 추가
      const newCubeMatrix = mat4.create();
      mat4.translate(newCubeMatrix, newCubeMatrix, targetPosition); // 병합 위치로 이동
      modelMatrices.push(newCubeMatrix); // 새로운 행렬 추가

      // 3초 뒤 텍스처로 변경
      setTimeout(() => {
      isRandomPhase = false; // 랜덤 컬러 종료
      currentTextureIndex = 4; // 텍스처 4번 적용
      }, 3000);
    }
  }
  else {
    let allMoved = true; // 모든 도형이 목표 위치에 도달했는지 확인
    const moveSpeed = 0.02; // 이동 속도

    // 현재 위치에서 목표 위치로 부드럽게 이동
    for (let i = 0; i < currentPositions.length; i++) {
        const nextTarget = TargetPositions[(i + 1) % TargetPositions.length]; // 다음 목표 위치
        for (let j = 0; j < 3; j++) { // x, y, z 좌표 각각 처리
            if (Math.abs(currentPositions[i][j] - nextTarget[j]) > 0.01) {
                currentPositions[i][j] += (nextTarget[j] - currentPositions[i][j]) * moveSpeed;
                allMoved = false; // 아직 이동 중인 도형이 있음
            }
        }

        // 모델 행렬 초기화 후 새로운 위치로 이동
        mat4.identity(modelMatrices[i]);
        mat4.translate(modelMatrices[i], modelMatrices[i], currentPositions[i]);
    }
    // 모든 도형이 목표 위치에 도달했는지 확인
    if (allMoved) 
    {
      // `TargetPositions` 배열을 순환적으로 갱신
      const temp = TargetPositions.shift(); // 첫 번째 위치를 꺼냄
      TargetPositions.push(temp); // 마지막 위치로 이동
    }
    if (modelMatrices.length === 1) 
    {
      // 모델 행렬 회전 추가
      for (let i = 0; i < modelMatrices.length; i++) 
      {
        const rotationSpeed = rotationSpeeds[i];
        mat4.rotateX(modelMatrices[i], modelMatrices[i], rotationSpeed[0]); // X축 회전
        mat4.rotateY(modelMatrices[i], modelMatrices[i], rotationSpeed[1]); // Y축 회전
        mat4.rotateZ(modelMatrices[i], modelMatrices[i], rotationSpeed[2]); // Z축 회전
      }
    }
  }
}

// 캔버스 배경색 변경 
const flashInterval = 100; // 색상 전환 간격(ms)

// 병합 상태에 따라 배경색 변경
function updateBackgroundColor() {
  if (isMerging) {
    const isEven = Math.floor(performance.now() / flashInterval) % 2 === 0;

    // 번갈아가며 색상 설정
    if (isEven) {
      gl.clearColor(0.2, 0.2, 0.8, 1.0); // 파란색
    } else {
      gl.clearColor(0.8, 0.2, 0.2, 1.0); // 빨간색
    }
  } else if (modelMatrices.length === 1) {
    gl.clearColor(0, 0, 0, 0.9); // 병합 완료 후 하얀색 배경
  } else {
    gl.clearColor(0, 0, 0, 0.9); // 기본 배경색
  }
}

// 렌더링 함수
function drawScene() {
  updateBackgroundColor(); // 배경색 업데이트

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  gl.useProgram(program);
  gl.bindVertexArray(vao);

  updateCamera();
  const viewProjectionMatrix = mat4.multiply(mat4.create(), projectionMatrix, viewMatrix);
  
  for (let i = 0; i < modelMatrices.length; i++) {
    const modelViewProjectionMatrix = mat4.multiply(
      mat4.create(),
      viewProjectionMatrix,
      modelMatrices[i]
    );
    gl.uniformMatrix4fv(matrixLocation, false, modelViewProjectionMatrix);

    if (isRandomPhase) 
    {
      gl.uniform1i(gl.getUniformLocation(program, "u_useColor"), 1); // 색상 사용
      gl.uniform4f(gl.getUniformLocation(program, "u_color"), Math.random(), Math.random(), Math.random(), 1.0); // 하얀색
    } 
    else 
    {
      gl.uniform1i(gl.getUniformLocation(program, "u_useColor"), 0); // 텍스처 사용
      if (modelMatrices.length === 1) 
        { 
          gl.bindTexture(gl.TEXTURE_2D, textures[currentTextureIndex ]);
        }
        else
        {
          gl.bindTexture(gl.TEXTURE_2D, textures[i % textures.length ]);
        }
    }

    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
  }
}

// 애니메이션 루프
function render() {
  updateModelPositions(); // 도형 위치 업데이트 
 
  drawScene();
  requestAnimationFrame(render);
}
requestAnimationFrame(render);
