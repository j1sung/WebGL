const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
  console.error("WebGL 2를 지원하지 않습니다.");
}

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
precision mediump float;
in vec2 v_texcoord; // 텍스쳐 좌표(텍셀) 받아옴 -> 색상
uniform sampler2D u_texture; // 텍스쳐 데이터 가져와서 샘플링
out vec4 outColor; // 셰이더 최종 색상

void main() {
  outColor = texture(u_texture, v_texcoord); // 텍스쳐 좌표를 받아서 샘플링해서 최종 색상 넘김
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
  -0.5, -0.5,  0.5,   0, 0,
   0.5, -0.5,  0.5,   1, 0,
   0.5,  0.5,  0.5,   1, 1,
  -0.5,  0.5,  0.5,   0, 1,

  // Back face
  -0.5, -0.5, -0.5,   0, 0,
  -0.5,  0.5, -0.5,   1, 0,
   0.5,  0.5, -0.5,   1, 1,
   0.5, -0.5, -0.5,   0, 1,

  // Top face
  -0.5,  0.5, -0.5,   0, 0,
  -0.5,  0.5,  0.5,   1, 0,
   0.5,  0.5,  0.5,   1, 1,
   0.5,  0.5, -0.5,   0, 1,

  // Bottom face
  -0.5, -0.5, -0.5,   0, 0,
   0.5, -0.5, -0.5,   1, 0,
   0.5, -0.5,  0.5,   1, 1,
  -0.5, -0.5,  0.5,   0, 1,

  // Right face
   0.5, -0.5, -0.5,   0, 0,
   0.5,  0.5, -0.5,   1, 0,
   0.5,  0.5,  0.5,   1, 1,
   0.5, -0.5,  0.5,   0, 1,

  // Left face
  -0.5, -0.5, -0.5,   0, 0,
  -0.5, -0.5,  0.5,   1, 0,
  -0.5,  0.5,  0.5,   1, 1,
  -0.5,  0.5, -0.5,   0, 1,
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
  gl.bindTexture(gl.TEXTURE_2D, texture); // 2D타깃 바인딩 - 텍스쳐 적용
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
  createTexture('texture_01.jpg'),
  createTexture('texture_02.jpg'),
  createTexture('texture_03.jpg')
];

// 행렬 설정
const matrixLocation = gl.getUniformLocation(program, "u_matrix");
let matrix1 = mat4.create();
mat4.perspective(matrix1, Math.PI / 4, canvas.width / canvas.height, 0.1, 10);
mat4.translate(matrix1, matrix1, [-2.5, -1, -8]);

let matrix2 = mat4.create();
mat4.perspective(matrix2, Math.PI / 4, canvas.width / canvas.height, 0.1, 10);
mat4.translate(matrix2, matrix2, [1.5, -1, -5]);

let matrix3 = mat4.create();
mat4.perspective(matrix3, Math.PI / 4, canvas.width / canvas.height, 0.1, 10);
mat4.translate(matrix3, matrix3, [0, 1, -6]);

// 렌더링 함수
function drawScene() {
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  gl.useProgram(program);
  gl.bindVertexArray(vao);

  // 왼쪽 도형 렌더링
  gl.uniformMatrix4fv(matrixLocation, false, matrix1);

  // 각 면에 대해 텍스처 적용 후 그리기
  const faceCount = 6; // 6개 면
  gl.bindTexture(gl.TEXTURE_2D, textures[0]); // 면에 텍스쳐를 각각 붙여줌
  for (let i = 0; i < faceCount; i++) {
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, i * 6 * 2); // 각 면의 시작 위치 인덱스 지정(i*6*2)
  }

  // 오른쪽 도형 렌더링
  gl.uniformMatrix4fv(matrixLocation, false, matrix2);

   // 각 면에 대해 텍스처 적용 후 그리기
  gl.bindTexture(gl.TEXTURE_2D, textures[1]); // 두 번째 텍스처
  for (let i = 0; i < faceCount; i++) {
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, i * 6 * 2);
  }

  // 가운데 도형 렌더링
  gl.uniformMatrix4fv(matrixLocation, false, matrix3);

   // 각 면에 대해 텍스처 적용 후 그리기
  gl.bindTexture(gl.TEXTURE_2D, textures[2]); // 두 번째 텍스처
  for (let i = 0; i < faceCount; i++) {
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, i * 6 * 2);
  }
}

// 애니메이션 루프
function render() {
  mat4.rotateY(matrix1, matrix1, -Math.PI*2 / 180);
  mat4.rotateY(matrix2, matrix2, Math.PI / 180);
  mat4.rotateX(matrix3, matrix3, -Math.PI*3 / 180);
  drawScene();
  requestAnimationFrame(render);
}
requestAnimationFrame(render);
