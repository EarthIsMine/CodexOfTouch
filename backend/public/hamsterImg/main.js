import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(0, 0, 10);

const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 조명 추가 (3D 모델용)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

/* 🐹 3D 모델 로드 */
let hamster = null;
let originalMaterials = []; // 원래 색상 저장용
let baseRotation = new THREE.Euler(0, 0, 0); // 초기 회전값

// 디버그: 테스트 큐브 추가 (모델 로드 전 렌더링 확인용)
const testGeometry = new THREE.BoxGeometry(1, 1, 1);
const testMaterial = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  wireframe: true,
});
const testCube = new THREE.Mesh(testGeometry, testMaterial);
scene.add(testCube);
console.log('테스트 큐브 추가됨');

const gltfLoader = new GLTFLoader();
gltfLoader.load(
  './hamster.glb',
  (gltf) => {
    hamster = gltf.scene;

    // 크기와 위치 조정
    hamster.scale.set(1, 1, 1);
    hamster.position.set(0, 0, 0);

    // 초기 회전값 설정
    baseRotation.set(0, 0, 0); // Pitch 0도, Yaw 0도, Roll 0도
    hamster.rotation.copy(baseRotation);

    // 원래 재질 색상 저장
    hamster.traverse((child) => {
      if (child.isMesh) {
        originalMaterials.push({
          mesh: child,
          color: child.material.color.clone(),
        });
      }
    });

    scene.add(hamster);

    // 테스트 큐브 제거
    scene.remove(testCube);

    console.log('3D 모델 로드 완료!', hamster);
  },
  (progress) => {
    console.log(
      '로딩 중...',
      ((progress.loaded / progress.total) * 100).toFixed(0) + '%',
    );
  },
  (error) => {
    console.error('GLB 로드 실패:', error);
  },
);

/* 😡 빡침 상태 */
let isAngry = false;
let angryStartTime = 0;
const ANGRY_DURATION = 2; // 2초 동안 빡침

/* 😊 기분 좋은 상태 */
let isHappy = false;
let happyStartTime = 0;
const HAPPY_DURATION = 2; // 2초 동안 기분 좋음

/* 🎭 외부에서 감정 제어 가능한 함수 */
window.triggerHamsterEmotion = function (isHappyEmotion) {
  if (!hamster) {
    console.warn('햄스터 모델이 아직 로드되지 않았습니다.');
    return;
  }

  if (isHappyEmotion) {
    // 😊 기분 좋음 발동!
    isHappy = true;
    isAngry = false;
    happyStartTime = clock.getElapsedTime();
    console.log('🐹💖 햄스터가 기분 좋아해요!');
  } else {
    // 😡 빡침 발동!
    isAngry = true;
    isHappy = false;
    angryStartTime = clock.getElapsedTime();
    console.log('🐹💢 햄스터가 화났어요!');
  }
};

/* 🔔 메시지 기반 감정 제어 */
window.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'pet-emotion') {
    return;
  }

  if (data.mood === 'happy') {
    window.triggerHamsterEmotion(true);
  } else if (data.mood === 'angry') {
    window.triggerHamsterEmotion(false);
  }
});

/* 🎈 애니메이션 */
let clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const t = clock.getElapsedTime();

  // 모델이 로드된 경우에만 애니메이션 적용
  if (hamster) {
    // 😡 빡침 체크
    if (isAngry && t - angryStartTime < ANGRY_DURATION) {
      // 빡침 진행률 (0 ~ 1)
      const angryProgress = (t - angryStartTime) / ANGRY_DURATION;
      const intensity = 1 - angryProgress; // 점점 약해짐

      // 😡 격렬하게 진동!
      hamster.position.x = Math.sin(t * 50) * 0.5 * intensity;
      hamster.position.y = Math.cos(t * 40) * 0.5 * intensity;

      // 😡 빠르게 회전!
      hamster.rotation.x = baseRotation.x;
      hamster.rotation.y = baseRotation.y + Math.sin(t * 30) * 0.5 * intensity;
      hamster.rotation.z = baseRotation.z + Math.cos(t * 25) * 0.3 * intensity;

      // 😡 크기 변화 (부풀어 오름)
      const angryScale = 1 + intensity * 0.5;
      hamster.scale.set(angryScale, angryScale, angryScale);

      // 😡 빨갛게! (3D 모델의 모든 메쉬에 적용)
      hamster.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.color.setRGB(
            1,
            1 - intensity * 0.7,
            1 - intensity * 0.7,
          );
        }
      });
    } else if (isHappy && t - happyStartTime < HAPPY_DURATION) {
      // 😊 기분 좋음 체크
      // 기분 좋음 진행률 (0 ~ 1)
      const happyProgress = (t - happyStartTime) / HAPPY_DURATION;
      const intensity = 1 - happyProgress; // 점점 약해짐

      // 😊 신나게 위아래로 통통!
      hamster.position.x = Math.sin(t * 8) * 0.3 * intensity;
      hamster.position.y = Math.abs(Math.sin(t * 10)) * 0.8 * intensity;

      // 😊 좌우로 흔들흔들
      hamster.rotation.x = baseRotation.x;
      hamster.rotation.y = baseRotation.y + Math.sin(t * 5) * 0.3 * intensity;
      hamster.rotation.z = baseRotation.z + Math.sin(t * 4) * 0.2 * intensity;

      // 😊 크기 변화 (반짝반짝)
      const happyScale = 1 + Math.sin(t * 15) * 0.1 * intensity;
      hamster.scale.set(happyScale, happyScale, happyScale);

      // 😊 밝은 노란색/파란색으로! (3D 모델의 모든 메쉬에 적용)
      hamster.traverse((child) => {
        if (child.isMesh && child.material) {
          const colorShift = Math.sin(t * 10) * 0.5 + 0.5;
          child.material.color.setRGB(1, 1, 0.5 + colorShift * 0.5 * intensity);
        }
      });
    } else {
      // 🐹 평상시 애니메이션
      if (isAngry || isHappy) {
        isAngry = false; // 빡침 종료
        isHappy = false; // 기분 좋음 종료

        // 원래 색으로 복원
        originalMaterials.forEach((item) => {
          if (item.mesh.material) {
            item.mesh.material.color.copy(item.color);
          }
        });
      }

      // 🐹 통통 바운스
      hamster.position.x = 0;
      hamster.position.y = Math.sin(t * 2) * 0.2;

      // 🐹 살짝 좌우 회전
      hamster.rotation.x = baseRotation.x;
      hamster.rotation.y = baseRotation.y + Math.sin(t * 1.5) * 0.15;
      hamster.rotation.z = baseRotation.z;

      // 🐹 숨 쉬는 느낌
      const scale = 1 + Math.sin(t * 3) * 0.05;
      hamster.scale.set(scale, scale, scale);
    }
  }

  renderer.render(scene, camera);
}

animate();

/* 📐 리사이즈 대응 */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
