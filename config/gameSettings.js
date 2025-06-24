export const SETTINGS = {
    TILE_SIZE: 192,
    DEFAULT_ZOOM: 0.5,
    // 포그 오브 워 표시 여부를 제어합니다.
    ENABLE_FOG_OF_WAR: true,
    // AI의 인간적인 실수 허용 여부를 제어합니다.
    ENABLE_MISTAKE_ENGINE: false,
    // 길찾기 연산을 Web Worker에서 처리할지 여부입니다.
    ENABLE_PATHFINDING_WORKER: true,
    // 아군 사이 MBTI 알파벳 친밀도에 따른 이동 보정 기능
    ENABLE_MBTI_INFLUENCE: false,
    // TensorFlow 기반 길찾기 모델 사용 여부입니다.
    // 모델 파일이 없거나 실험적인 기능을 끄고 싶다면 false로 두세요.
    ENABLE_TENSORFLOW_PATHING: false,
    // WebGL 렌더러 사용 여부입니다.
    ENABLE_WEBGL_RENDERER: true,
    // 평판 시스템 사용 여부입니다. 성능 문제가 있을 때 비활성화하면
    // 메모리 기록과 모델 로드를 생략해 속도를 높일 수 있습니다.
    ENABLE_REPUTATION_SYSTEM: true,
    // guideline markdown files will be loaded from this GitHub API path
    // example: 'user/repo/contents/guidelines?ref=main'
    GUIDELINE_REPO_URL: "https://github.com/cagecorn/doom-crawler-newest/blob/main/TensorFlow's%20room/guideline.md",
    // 이동 속도는 StatManager의 'movement' 스탯으로부터 파생됩니다.
    // ... 나중에 더 많은 설정 추가
};
