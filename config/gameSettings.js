export const SETTINGS = {
    TILE_SIZE: 192,
    DEFAULT_ZOOM: 0.5,
    // 포그 오브 워 표시 여부를 제어합니다.
    ENABLE_FOG_OF_WAR: true,
    // AI의 인간적인 실수 허용 여부를 제어합니다.
    ENABLE_MISTAKE_ENGINE: true,
    // TensorFlow 기반 길찾기 모델 사용 여부입니다.
    // 모델 파일이 없거나 실험적인 기능을 끄고 싶다면 false로 두세요.
    ENABLE_TENSORFLOW_PATHING: false,
    // guideline markdown files will be loaded from this GitHub API path
    // example: 'user/repo/contents/guidelines?ref=main'
    GUIDELINE_REPO_URL: 'https://github.com/cagecorn/doom-crawler-newest/blob/main/TensorFlow's%20room/guideline.md',
    // 이동 속도는 StatManager의 'movement' 스탯으로부터 파생됩니다.
    // ... 나중에 더 많은 설정 추가
};
