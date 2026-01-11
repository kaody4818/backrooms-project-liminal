# Technical Design Document (TDD): Project Liminal

## 1. 아키텍처 개요 (Architecture Overview)
### 1.1 기술 스택 선정 및 이유
*   **Core:** React 18, Vite (빠른 HMR 및 빌드 속도)
*   **3D Engine:** `@react-three/fiber` (R3F) - React 생태계와 Three.js의 강력한 통합
*   **Physics:** `@react-three/cannon` - Worker 기반으로 동작하여 메인 스레드 부하 감소, 웹 환경에 적합한 가벼운 물리 엔진
*   **State Management:** `Zustand` - 간결한 API, React 외부(non-component)에서도 상태 접근 용이 (예: Canvas 내부 루프)
*   **Performance:** `three-stdlib` (유틸리티), `stats.gl` (성능 모니터링)

### 1.2 디렉토리 구조 (Directory Structure)
```
src/
├── assets/          # 텍스처, 모델, 사운드 리소스
├── components/
│   ├── ui/          # HUD, 메뉴 등 2D UI 컴포넌트
│   ├── world/       # 맵, 환경 오브젝트 3D 컴포넌트
│   ├── player/      # 플레이어 컨트롤러, 카메라
│   └── entities/    # 적 AI 및 NPC
├── hooks/           # 커스텀 훅 (useKeyboardControls, useSound 등)
├── store/           # Zustand 스토어 (gameStore, playerStore)
├── utils/           # 절차적 생성 알고리즘, 수학 유틸리티
└── App.tsx
```

## 2. 핵심 시스템 상세 설계 (Core Systems Design)

### 2.1 절차적 맵 생성 (Procedural Map Generation)
*   **알고리즘:** 'Wave Function Collapse' (WFC)의 단순화 버전 또는 'Grid-based Depth-First Search' (미로 생성) 사용.
*   **청크 시스템 (Chunking):** 
    *   무한한 맵이 아닌, 플레이어 주변 일정 반경(예: 3x3 청크)만 렌더링하고 나머지는 로딩 해제.
    *   각 청크는 미리 구워진(Pre-fabricated) 방 모듈의 조합으로 구성.
*   **최적화:** `InstancedMesh`를 사용하여 벽, 바닥, 천장 등 반복되는 지오메트리 렌더링 호출(Draw Call) 최소화.

### 2.2 플레이어 및 물리 시스템 (Player & Physics)
*   **이동:** WASD + Shift(달리기). `KinematicCharacterController` 방식 사용.
    *   직접적인 힘(Force) 적용보다는 속도(Velocity) 제어로 부드러운 움직임 구현.
*   **카메라:** 1인칭 시점. 마우스 룩(Pointer Lock API).
    *   **Bobbing:** 걷거나 뛸 때 카메라 흔들림 효과.
    *   **Sway:** 마우스 회전 시 약간의 관성 효과 추가.

### 2.3 그래픽생 및 VHS 효과 (Graphics & VHS Effects)
*   **조명:** 실시간 그림자는 성능 비용이 높으므로, 플레이어 손전등(SpotLight)에만 동적 그림자 적용. 환경광은 Baked Lightmap 또는 단순한 Ambient/Point Light 조합 사용.
*   **Post-processing:** `@react-three/postprocessing` 라이브러리 활용.
    *   **NoiseEffect:** 필름 그레인 효과.
    *   **ChromaticAberration:** 렌즈 색수차.
    *   **Vignette:** 화면 가장자리 어둡게 처리.
    *   **Scanline:** 옛날 TV/캠코더 느낌.

### 2.4 상태 관리 (State Management - Zustand)
*   **GameStore:** 현재 레벨, 게임 상태(메뉴, 플레이, 오버), 점수/시간.
*   **PlayerStore:** 위치, 체력(Stamina), 정신력(Sanity), 인벤토리.
    *   `subscribe` 패턴을 사용하여 상태 변경 시 특정 로직(예: 사운드 재생, 사망 트리거) 실행.

## 3. 성능 최적화 전략 (Performance Optimization)
1.  **리소스 관리:** 텍스처는 압축 포맷(Basis/KTX2) 사용 또는 저해상도 텍스처 사용 후 VHS 필터로 퀄리티 저하 감춤 (레트로 컨셉이므로 유리).
2.  **Web Workers:** 
    *   물리 연산은 이미 Worker에서 실행됨.
    *   복잡한 맵 생성 로직이 필요할 경우 별도 Worker로 분리 고려.
3.  **LOD (Level of Detail):** 멀리 있는 오브젝트는 렌더링하지 않거나 저폴리곤으로 대체 (실내 맵이라 Occlusion Culling이 더 중요).
4.  **Occlusion Culling:** 벽 뒤에 있어 보이지 않는 오브젝트 렌더링 생략.

## 4. 사운드 시스템 (Sound System)
*   **Positional Audio:** Three.js의 `PositionalAudio` 활용.
    *   플레이어와 소리 근원지 사이의 거리에 따른 볼륨 감쇠(Rolloff).
*   **Ambient:** 백그라운드 험(Hum) 노이즈는 글로벌 오디오로 루핑.

## 5. 단계별 구현 계획 (Implementation Phases)
1.  **Phase 1 (Skeleton):** R3F 씬 셋업, 기본 바닥/벽 렌더링, 1인칭 카메라 이동 구현.
2.  **Phase 2 (Environment):** 텍스처 적용, 조명 설정, VHS 포스트 프로세싱 적용.
3.  **Phase 3 (Map Gen):** 맵 생성 알고리즘 구현 및 `InstancedMesh` 최적화.
4.  **Phase 4 (Gameplay):** 충돌 처리, 상호작용, UI 연동.
