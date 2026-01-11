# Product Requirement Document (PRD): Project Liminal

## 1. 개요 (Overview)
**프로젝트 명:** Project Liminal (가제)
**장르:** 1인칭 심리적 서바이벌 호러 / 로그라이트 (1st Person Psychological Survival Horror / Roguelite)
**플랫폼:** 웹 (Web Browser) - PC 데스크탑 환경 최적화
**핵심 컨셉:** "끝없이 펼쳐진 노란 벽지의 미로 속에서, 당신은 혼자가 아닐 수도 있습니다."
Backrooms 세계관을 기반으로 한 3D 웹 게임으로, 절차적으로 생성되는 레벨을 탐험하고 생존하며 탈출구를 찾아내는 것이 목표입니다.

## 2. 목표 (Goals)
1.  **몰입감 있는 환경:** 웹 브라우저 상에서도 Backrooms 특유의 불안하고 몽환적인 분위기(Liminal Space)를 시각/청각적으로 완벽하게 구현한다.
2.  **재플레이 가치:** 절차적 생성(Procedural Generation)을 통해 매번 다른 구조의 맵을 제공하여 반복 플레이의 재미를 준다.
3.  **접근성:** 별도의 설치 없이 브라우저 링크만으로 고품질의 3D 호러 경험을 제공한다.

## 3. 핵심 기능 및 게임플레이 (Core Gameplay & Features)

### 3.1 게임 루프 (Game Loop)
1.  **진입 (Entry):** 플레이어는 레벨 0(The Lobby)의 랜덤한 위치에서 깨어납니다.
2.  **탐험 (Exploration):** 미로를 돌아다니며 다음 레벨로 가기 위한 '단서(Evidence)'나 '열쇠(Key)'를 수집해야 합니다.
3.  **생존 (Survival):**
    *   **Sanity (정신력):** 오랫동안 같은 곳을 맴돌거나, 엔티티를 마주치면 정신력이 감소합니다. 정신력이 낮아지면 환각이 보이고 화면이 왜곡됩니다.
    *   **Stamina (체력):** 달릴 수 있는 시간은 제한적입니다. 엔티티로부터 도망칠 때 전략적으로 사용해야 합니다.
4.  **탈출 (Escape):** 조건을 만족하면 'Noclip' 포인트나 비상구 문이 활성화되어 다음 레벨로 이동합니다.
5.  **사망 (Death):** 엔티티에게 잡히거나 정신력이 0이 되면 게임 오버. (로그라이크 요소: 처음부터 다시 시작하거나, 일부 수집품만 유지)

### 3.2 레벨 디자인 (Level Design)
*   **Level 0 - The Lobby:** 노란 벽지, 젖은 카펫 냄새, 윙윙거리는 형광등. 엔티티는 없거나 매우 드물지만, 구조적 혼란으로 인한 공포 강조.
*   **Level 1 - Habitable Zone:** 콘크리트 창고 분위기. 보급품이 존재하지만 엔티티 출몰 빈도 증가.
*   **Level 2 - Pipe Dreams:** 좁은 터널과 파이프가 많은 곳. 높은 열기. 빠른 엔티티 등장.

### 3.3 엔티티 (Entities)
*   **The Smiler:** 어둠 속에서 빛나는 웃는 얼굴. 빛을 좋아하므로 광원을 끄고 숨어야 함.
*   **Hound:** 네 발로 기어 다니는 인간형 괴물. 시선을 마주치면 위협적으로 변함.
*   **Dullers:** 플레이어의 정신력을 갉아먹는 그림자 같은 존재.

### 3.4 아이템 (Items)
*   **Almond Water:** 정신력 회복 및 소량의 체력 회복.
*   **Flashlight:** 어두운 구역 탐험 필수 아이템 (배터리 제한).
*   **Radio:** 근처 엔티티의 존재를 노이즈로 알려줌.

## 4. 기술 스택 (Tech Stack)
웹 기반의 고성능 3D 구현을 위해 다음 기술을 사용합니다.
*   **Framework:** React + Vite
*   **3D Engine:** Three.js (via **React-Three-Fiber**)
*   **Physics:** Cannon.js (via **@react-three/cannon**)
*   **State Management:** Zustand
*   **Styling:** TailwindCSS (UI 오버레이 및 메뉴)
*   **Effect:** Post-processing (VHS 효과, 노이즈, 색수차 효과 구현)

## 5. UI/UX 디자인
*   **HUD:** 최소한의 UI. 캠코더 뷰파인더 느낌의 오버레이 (배터리 잔량, 녹화 시간 등).
*   **메뉴:** 레트로 VHS 스타일의 글리치 효과가 들어간 메뉴 화면.
*   **사운드:** 3D 공간 음향(Positional Audio) 필수 적용. 형광등 소음(Hum-buzz)이 배경음으로 깔림.

## 6. 개발 마일스톤 (Milestones)
*   **Phase 1 (MVP):** Level 0 맵 생성, 기본 플레이어 이동, 카메라 VHS 효과 구현.
*   **Phase 2:** 상호작용(아이템 줍기), 정신력 시스템, 간단한 엔티티 AI 추가.
*   **Phase 3:** 레벨 확장(Level 1, 2), 사운드 폴리싱, 저장 시스템, 최종 배포.
