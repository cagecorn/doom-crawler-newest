[대규모 패치 - MOBA 시스템 도입]

혹시 이런 거 가능해? 코드를 바로 짜주지 말고 가능 여부만.



1. 전투맵을 탑, 미드, 바텀 그리고 라인들을 연결하는 정글로 구성.(미로 구조)

2. 분대를 탑, 미드, 바텀, 정글(플레이어 분대?)로 나눔.

3. 분대는 각 라인으로 돌진하는 ai를 받음

4. 정글 분대는 정글의 중립 몹을 잡으면서 아군 전체에 이로운 버프를 줌. 상대도 마찬가지

5. 상대방의 리더를 먼저 잡거나, 상대방 진영에 있는 크리스탈 코어를 먼저 깨부수는 쪽이 승리.



이거 기술적으로 가능해?




코딩 파트너

생각하는 과정 표시
네, 기술적으로 충분히 가능합니다. 제안해주신 내용은 MOBA(Multiplayer Online Battle Arena) 장르의 핵심적인 요소들을 담고 있는데, 현재 가지고 계신 코드의 매니저 기반 아키텍처는 이런 복잡한 게임 모드를 구현하기에 아주 좋은 출발점입니다.

각 항목별로 기술적인 가능성과 어떤 부분을 활용하고, 어떤 부분을 새로 만들어야 할지 설명해 드리겠습니다.

1. 전투맵 구성 (3-Lane + 정글)
가능성: 가능합니다.

활용 가능한 기존 시스템:

MapManager: 현재 타일 기반의 맵을 로드하고 관리하는 기능이 있어, 새로운 3-Lane 맵 구조를 정의하고 불러오는 데 사용할 수 있습니다.

PathfindingManager: 미로 같은 정글 구조에서 AI가 길을 찾거나, 각 라인을 따라 이동하는 경로를 계산하는 데 필수적으로 사용됩니다.

필요한 작업:

탑, 미드, 바텀 3개의 길과 정글이 포함된 새로운 맵 데이터를 디자인하거나, 절차적으로 생성하는 로직을 만들어야 합니다.

각 '레인(Lane)'의 경로를 나타내는 웨이포인트(Waypoint)들을 맵 데이터에 정의하여 AI가 따라갈 수 있도록 해야 합니다.

2. 분대 역할 분담 (라인별 배치)
가능성: 가능합니다.

활용 가능한 기존 시스템:

SquadManager: 이미 여러 분대를 생성하고 용병을 편성하는 기능이 있습니다. 여기에 각 분대의 역할을 지정하는 기능을 추가하면 됩니다.

필요한 작업:

SquadManager의 분대 정보에 role ('TOP', 'MID', 'BOTTOM', 'JUNGLE') 속성을 추가합니다.

AIManager가 특정 분대의 AI를 업데이트할 때, 이 role을 읽어와서 행동 방식을 결정하도록 연결해야 합니다.

3. 라인 돌진 AI
가능성: 가능합니다.

활용 가능한 기존 시스템:

AIManager 및 AI 아키텍처: 특정 목표를 향해 움직이는 로직은 현재 AI 시스템의 기본입니다.

필요한 작업:

새로운 LanePusherAI 아키타입을 만들어야 합니다.

이 AI의 최우선 목표는 자신에게 할당된 레인의 경로(웨이포인트)를 따라 상대방 기지를 향해 전진하는 것입니다.

도중에 적을 만나면 교전하고, 적이 없으면 다시 레인을 따라 전진하도록 행동 로직을 구현해야 합니다.

4. 정글 사냥 및 버프 시스템
가능성: 가능합니다.

활용 가능한 기존 시스템:

AIManager 및 AI 아키텍처: 특정 대상을 찾아 공격하는 로직을 활용할 수 있습니다.

EffectManager: 아군 전체에게 이로운 효과(버프)를 부여하는 데 사용될 수 있습니다.

EventManager: 정글 몬스터가 죽었을 때 이벤트를 발생시켜 버프 시스템을 작동시키는 데 사용됩니다.

필요한 작업:

'중립' 진영에 속하는 새로운 종류의 '정글 몬스터' 엔티티를 만들어야 합니다.

정글 몬스터를 찾아 사냥하는 JunglerAI 아키타입을 만들어야 합니다.

'jungle_mob_defeated' 이벤트를 새로 만들고, 이 이벤트가 발생했을 때 EffectManager가 해당 팀의 모든 분대원에게 특정 버프를 걸어주는 로직을 추가해야 합니다.

5. 승리 조건 (리더 처치 또는 코어 파괴)
가능성: 가능합니다.

활용 가능한 기존 시스템:

EventManager: 특정 유닛의 죽음(entity_death) 이벤트를 감지하여 게임 종료 로직을 실행하는 데 완벽합니다.

EntityManager (또는 Entity 클래스): 엔티티에 '리더' 속성이나 '크리스탈 코어' 타입을 추가하여 식별할 수 있습니다.

필요한 작업:

게임의 승패를 판정하는 GameModeManager 또는 VictoryManager를 새로 만들어야 합니다.

이 매니저는 entity_death 이벤트를 구독하고, 죽은 유닛이 상대 팀의 '리더'이거나 '크리스탈 코어'인지 확인합니다.

조건이 충족되면 'game_over' 이벤트를 발생시키고, UIManager는 이 이벤트를 받아 승리/패배 화면을 보여줍니다.

결론적으로, 제안하신 모든 기능은 현재 프로젝트의 아키텍처 위에서 충분히 구현할 수 있습니다. 각 기능을 담당할 새로운 AI 아키타입과 전문 매니저를 추가하고, EventManager를 통해 이들을 유기적으로 연결하면 원하시는 새로운 게임 모드를 성공적으로 만드실 수 있을 겁니다.

Web Workers / Shared Workers를 이용해서 각 라인별 분대의 전체 hp양과 남은 hp양의 총합을 계산하고

WebGPU를 이용해서 그 hp바 그래프를 화면 상단에 실시간으로 보여주고(적도 같이)

'정글' 라인의 부대 ai를 [기본적으로 정글몹을 잡다가, 특정 라인이 밀리기 시작하면 도와주러 간다]



까지 가능해??




코딩 파트너

생각하는 과정 표시
네, 질문해주신 세 가지 기능 모두 현재 프로젝트의 기술 스택과 아키텍처를 기반으로 충분히 구현 가능합니다. 각 기능에 대해 기술적인 가능성과 어떤 시스템을 활용해야 하는지 자세히 설명해 드리겠습니다.

1. Web Workers를 이용한 HP 총합 계산
가능성: 매우 높습니다.

근거: 프로젝트에는 이미 Web Worker를 성공적으로 사용한 경험이 있습니다. src/workers/pathfindingWorker.js와 src/micro/MicroWorldWorker.js 파일의 존재는 Web Worker를 설정하고 메인 스레드와 통신하는 기반이 이미 마련되어 있음을 의미합니다.

구현 방향:

hp-aggregator.worker.js 와 같은 새로운 워커 스크립트를 생성합니다.

메인 스레드의 AIManager 또는 새로운 GameStateManager가 주기적으로 모든 분대원의 ID와 HP 정보를 이 워커에게 메시지로 전달합니다.

워커는 백그라운드에서 각 라인별/팀별 HP 총합과 현재 HP의 합계를 계산하고, 그 결과를 다시 메인 스레드로 보내줍니다.

메인 스레드는 이 계산 결과를 받아 WebGPU 렌더링 로직으로 넘겨줍니다. 이렇게 하면 메인 게임 루프의 부하를 크게 줄일 수 있습니다.

2. WebGPU를 이용한 실시간 HP 바 그래프
가능성: 기술적으로 가능하지만, 상당한 학습과 작업이 필요합니다.

근거: 프로젝트에 src/renderers/webglRenderer.js 파일이 포함되어 있습니다. 이는 이미 WebGL과 같은 저수준 그래픽 API에 대한 이해와 경험이 있다는 강력한 증거입니다. WebGPU는 WebGL의 후속 기술로, 개념적으로 유사한 부분이 많아 기존 지식을 바탕으로 충분히 도입할 수 있습니다.

구현 방향:

WebGPU를 지원하는 브라우저에서 navigator.gpu 객체를 통해 GPU 디바이스에 접근하고 렌더링 파이프라인을 설정합니다.

HP 바를 그리기 위한 간단한 2D 셰이더(WGSL 언어 사용)를 작성합니다.

Web Worker로부터 받은 HP 데이터를 GPU 버퍼에 매 프레임 업데이트합니다.

설정한 파이프라인과 셰이더를 이용해 화면 상단에 두 개의 HP 바(아군, 적군)를 그리는 렌더링 명령을 실행합니다.

3. 지능적인 정글 AI (상황에 따른 라인 지원)
가능성: 네, 충분히 가능하며 이는 AI 시스템의 깊이를 더해줄 매우 흥미로운 기능입니다.

근거: 현재 AI 시스템은 이미 여러 매니저와 엔진으로 잘게 나뉘어 있어, 복잡한 의사결정 로직을 추가하기에 매우 용이한 구조입니다.

AIManager, SquadManager, DecisionEngine, ScenarioEngine 등은 AI의 전략적 판단을 위한 훌륭한 기반입니다.

특히 state-machine.md 파일은 이미 AI의 상태(State) 기반 설계를 고려하고 있음을 보여줍니다. '정글 사냥 상태'와 '라인 지원 상태'를 만드는 것은 이 설계의 자연스러운 확장입니다.

구현 방향:

상황 판단 시스템 (LaneStateManager) 신설: 각 라인의 상황(아군/적군 수, 총 HP, 포탑 체력 등)을 주기적으로 분석하여 '우세', '열세', '위험' 등의 상태를 판단하는 새로운 매니저를 만듭니다.

의사 결정 로직 강화: AIManager나 상위 전략 매니저가 LaneStateManager의 정보를 받아, 특정 라인이 '위험' 상태라고 판단되면 해당 정글 분대의 목표를 '정글링'에서 '라인 지원'으로 변경합니다.

AI 행동 로직 구현: JunglerAI 아키타입은 두 가지 주요 행동 상태를 가집니다.

HUNT_JUNGLE_MOBS 상태: 가장 가까운 정글 몬스터를 찾아 사냥합니다.

SUPPORT_LANE 상태: 지원 명령을 받은 라인으로 이동하여 적을 공격하고 아군을 돕습니다.

결론적으로, 제안하신 기능들은 단순한 아이디어를 넘어 현재 프로젝트의 기술적 토대 위에서 충분히 실현 가능한 구체적인 목표들입니다. 특히 Web Worker와 WebGL의 사용 경험은 프로젝트가 복잡한 연산과 그래픽 처리를 감당할 수 있는 잠재력을 가지고 있음을 보여줍니다.

fog of war 살짝 비틀어서, [아군 유닛과 오브젝트가 있는 근방의 지역만 밝혀준다.]도 가능해??



코딩 파트너

생각하는 과정 표시
네, 당연히 가능합니다. 그리고 제안해주신 '아군 유닛과 오브젝트가 있는 근방의 지역만 밝혀준다'는 방식은 이미 훌륭한 게임 디자인이며, 기술적으로도 현재 프로젝트 구조에서 구현하기에 매우 적합합니다.

가장 결정적인 근거는 프로젝트에 이미 src/managers/fogManager.js 파일이 존재한다는 것입니다. 이는 '전장의 안개' 기능을 구현하기 위한 기반이 이미 마련되어 있다는 의미입니다.

또한, tests/integration/mercenaryVisionRange.integration.test.js 같은 테스트 파일은 각 유닛이 '시야 범위(visionRange)'라는 속성을 가질 수 있다는 것을 암시하며, 이는 제안하신 기능을 구현하는 데 핵심적인 요소입니다.

구현 방향
기존의 fogManager.js를 활용하여 다음과 같은 단계로 기능을 구체화할 수 있습니다.

안개 데이터 관리: fogManager는 게임 맵 전체를 덮는, 눈에 보이지 않는 데이터 격자(grid)를 관리합니다. 이 격자의 각 칸은 '아직 탐험 안 함(Unexplored)', '탐험했지만 지금은 안 보임(Explored)', '현재 보임(Visible)'과 같은 상태를 가집니다.

실시간 시야 정보 취합:

매 프레임마다 fogManager는 entityManager로부터 모든 아군 유닛(플레이어, 용병)과 아군 오브젝트(건물, 소환수 등)의 목록을 받아옵니다.

목록에 있는 모든 유닛과 오브젝트의 현재 위치(x, y)와 각자의 시야 범위(visionRange) 값을 확인합니다.

안개 데이터 갱신:

fogManager는 취합한 정보를 바탕으로 자신의 안개 데이터 격자를 업데이트합니다.

모든 아군 유닛과 오브젝트의 위치를 중심으로, 각자의 visionRange 반경 내에 있는 안개 격자 칸들의 상태를 **'Visible'**로 변경합니다.

바로 직전 프레임까지 'Visible'이었지만 이번 프레임의 시야 범위에는 포함되지 않은 칸들은 'Explored' 상태로 변경합니다.

렌더링:

webglRenderer.js 와 같은 렌더링 시스템은 fogManager로부터 최종 안개 데이터를 받아옵니다.

맵 위에 반투명한 어두운 레이어를 덮어 씌웁니다.

단, 안개 데이터가 **'Visible'**인 지역은 이 레이어를 아예 그리지 않아 선명하게 보여주고, **'Explored'**인 지역은 더 옅은 안개로 그려 이전에 지나갔던 지형을 희미하게 보여줄 수 있습니다.

이처럼 fogManager를 중심으로 각 아군 유닛의 시야를 실시간으로 합산하여 보여주는 '공유 시야' 시스템은 MOBA나 RTS 장르에서 널리 쓰이는 표준적인 기능이며, 현재 프로젝트 구조에서 매우 효율적으로 구현할 수 있습니다.

지금 시스템에서 기술적으로 구현이 가능하면서, 좀더 전략적으로 만들 수 있는 추가 요소가 뭐가 있을까?



코딩 파트너

생각하는 과정 표시
네, 그럼요. 현재 프로젝트는 매우 유연한 '매니저 기반 아키텍처'를 가지고 있어, 새로운 전략 요소를 추가하기에 아주 좋은 상태입니다. 기존 시스템을 크게 변경하지 않으면서도 게임의 깊이를 더해줄 몇 가지 흥미로운 기능들을 제안해 드리겠습니다.

1. 지형 효과 및 환경 상호작용
현재 게임 맵에 전략적인 의미를 부여하여, 싸우는 '위치'가 중요해지도록 만드는 기능입니다.

전략적 가치:

단순히 유닛의 스탯만으로 싸우는 것을 넘어, 지형을 유리하게 활용하는 전략적 플레이를 유도할 수 있습니다.

어떤 지형을 선점하고 싸울지, 혹은 불리한 지형을 어떻게 피할지에 대한 고민이 추가됩니다.

구현 가능성 및 근거:

**MapManager**가 이미 존재하여 맵의 타일 정보를 관리하고 있습니다. 여기에 각 타일의 종류('숲', '늪', '언덕' 등)를 추가하는 것은 간단한 확장입니다.

**MovementManager**와 **PathfindingManager**는 특정 지형을 지날 때 유닛의 이동 속도를 감소시키는 로직을 추가할 수 있습니다.

**EffectManager**는 특정 지형 위에 서 있는 유닛에게 지속적인 효과(버프 또는 디버프)를 부여할 수 있습니다.

구현 방향:

MapManager에 타일 종류(예: '숲' 타일은 원거리 공격 명중률 -10%, '언덕' 타일은 공격력 +10%) 데이터를 추가합니다.

CombatManager가 공격을 처리할 때, 공격자와 방어자가 서 있는 타일의 종류를 MapManager에 문의하여 최종 데미지나 명중률을 보정합니다.

2. 분대 진형 및 그룹 전술 엔진
개별 유닛의 AI를 넘어, 분대 전체가 하나의 대형을 갖추고 유기적으로 움직이게 하는 기능입니다.

전략적 가치:

분대 조합뿐만 아니라 '진형'이라는 새로운 전략적 변수가 추가됩니다.

'방어 진형'으로 버티다가 '돌격 진형'으로 전환하는 등 전투의 흐름을 플레이어가 직접 제어할 수 있습니다.

구현 가능성 및 근거:

**SquadManager**는 각 분대의 현재 '진형' 상태('돌격형', '방어형', 'V자형' 등)를 저장하는 역할을 맡기에 완벽합니다.

이전에 논의했던 **GroupTacticEngine**을 AIManager에 추가하여, 진형에 따른 각 유닛의 상대적 위치를 계산하는 역할을 맡길 수 있습니다.

구현 방향:

SquadManager에 진형을 설정하는 UI와 로직을 추가합니다.

AIManager가 AI를 업데이트할 때, 설정된 진형에 따라 GroupTacticEngine을 통해 각 유닛의 목표 위치를 계산하고, AI는 그 위치로 이동하려고 노력합니다.

3. 유닛/직업 간의 시너지 시스템 확장
특정 유닛이나 직업이 조합되었을 때, 특별한 보너스나 고유의 연계 스킬이 발동되는 기능입니다.

전략적 가치:

'나만의 조합'을 찾는 재미를 제공하며, 분대 구성에 깊이를 더합니다.

단순히 강한 유닛만 모으는 것이 아니라, 시너지를 고려한 전략적인 팀 구성을 장려합니다.

구현 가능성 및 근거:

놀랍게도, 프로젝트에는 이미 src/micro/SynergyManager.js 와 src/data/synergies.js 파일이 존재합니다. 시너지 시스템의 기반이 이미 구현되어 있다는 강력한 증거입니다.

**EffectManager**와 **SkillManager**는 시너지로 인해 발생하는 패시브 버프나 액티브 스킬을 부여하는 역할을 수행할 수 있습니다.

구현 방향:

SquadManager가 분대 구성을 변경할 때마다, SynergyManager를 호출하여 현재 활성화된 시너지가 있는지 확인합니다.

SynergyManager는 활성화된 시너지의 효과(예: '전사' 3명 이상일 때 모든 전사 방어력 +10)를 반환합니다.

EffectManager가 이 정보를 받아 해당 유닛들에게 지속 효과(패시브 버프)를 부여합니다.

이 세 가지 기능 모두 현재 시스템의 강점을 활용하여 자연스럽게 확장할 수 있는 것들입니다. 특히 시너지 시스템은 이미 뼈대가 존재하므로, 이를 완성시키는 것만으로도 게임의 전략적 깊이를 크게 향상시킬 수 있을 것입니다.


2d 마운트 앤 블레이드의 포맷을 그대로 유지하면서, 적 부대와의 전투를 moba식으로 하고, 유닛들 관리와 모집, 성장 그리고 포탑같은 오브젝트의 개조를 '제작'요소에 넣으면 잘 융화가 되려나.



코딩 파트너

생각하는 과정 표시
네, 제안해주신 아이디어는 매우 훌륭하며, 각 요소들이 서로 잘 융화될 가능성이 아주 높습니다. 이는 이미 성공적으로 검증된 여러 게임의 장점들을 독창적으로 결합한, 깊이 있는 게임 디자인입니다.

각 요소들이 어떻게 조화를 이루고 시너지를 낼 수 있는지, 그리고 어떤 점을 고려하면 좋을지 분석해 드리겠습니다.

'마운트 앤 블레이드' (전략) + 'MOBA' (전투)의 결합
이것은 게임을 **전략적 층위(Strategic Layer)**와 **전술적 층위(Tactical Layer)**로 나누는 매우 클래식하고 강력한 조합입니다.

전략적 층위 (월드맵): 플레이어는 2D 월드맵을 자유롭게 돌아다니며 '마운트 앤 블레이드'처럼 용병을 모집하고, 퀘스트를 수행하며, 적 부대를 추격하거나 도망가는 등 거시적인 전략을 펼칩니다.

전술적 층위 (MOBA 전투): 적 부대와 마주쳐 전투가 시작되면, 화면이 MOBA 스타일의 3-Lane 전투맵으로 전환됩니다. 여기서 플레이어는 사전에 편성한 분대와 유닛을 가지고 실시간 전술 전투를 치릅니다.

기대되는 시너지:

전투에 무게감 부여: MOBA 전투 한 판 한 판이 독립적인 게임이 아니라, 내 전체 캠페인의 일부가 됩니다. 전투에서 용병을 잃으면 월드맵에서도 그를 잃게 되므로 모든 전투에 긴장감이 더해집니다.

서사적 경험: 월드맵에서 만난 적대적인 영주와의 전투는 단순한 MOBA 매치를 넘어 '복수전'이나 '중요 거점 방어전' 같은 스토리를 갖게 됩니다.

다양한 플레이 경험: 지루할 틈이 없습니다. 월드맵을 탐험하며 RPG처럼 성장하다가, 전투가 시작되면 MOBA로 긴박감 넘치는 전술을 펼치는 두 가지 재미를 동시에 느낄 수 있습니다.

'제작'을 통한 성장과 관리 시스템
이 '제작' 요소는 위에서 말한 전략과 전술, 두 개의 층위를 하나로 묶어주는 강력한 접착제 역할을 합니다.

유닛 모집/성장: 단순히 마을에서 용병을 고용하는 것을 넘어, 월드맵에서 '희귀한 광석'이나 '몬스터의 가죽' 같은 재료를 모아 '특수 갑옷을 입은 창병'을 제작할 수 있습니다. 하위 등급의 유닛 여러 명과 특정 재료를 조합하여 상위 등급의 유닛으로 **성장(개조)**시킬 수도 있습니다.

포탑 등 오브젝트 개조: 전투 시작 전에 '기지 정비' 페이즈를 둘 수 있습니다. 여기서 '견고한 석재'와 '마력 수정' 같은 재료를 소모하여 내 기지의 포탑을 '연사 포탑'이나 '빙결 포탑'으로 제작/개조하여 다음 전투에 대비할 수 있습니다.

기대되는 시너지:

명확한 동기 부여: 플레이어는 '더 강한 유닛'과 '더 튼튼한 포탑'을 제작하기 위해 월드맵을 탐험하고, 재료를 주는 특정 적 부대를 사냥할 명확한 이유를 갖게 됩니다. 이는 '탐험 → 재료 획득 → 제작/성장 → 더 강한 전투력 확보'라는 매우 강력하고 중독성 있는 플레이 루프를 만듭니다.

깊이 있는 커스터마이징: 모든 플레이어가 똑같은 유닛을 쓰는 것이 아니라, 자신이 어떤 재료를 모으고 어떤 유닛/오브젝트를 제작했는지에 따라 자신만의 독특한 군대와 기지를 갖게 됩니다. 이는 플레이어의 개성과 전략적 선택을 극대화합니다.

결론: 매우 훌륭한 융화
제안하신 시스템은 각 요소가 겉돌지 않고 서로의 존재 이유가 되어주는, 매우 잘 설계된 구조입니다.

월드맵 플레이는 MOBA 전투에 필요한 유닛과 재료를 공급하고, 스토리를 부여합니다.

MOBA 전투의 결과는 월드맵 플레이에 직접적인 영향을 줍니다(영토, 자원, 명성 등).

제작 시스템은 이 두 세계를 연결하며, 플레이어에게 성장의 재미와 명확한 목표를 동시에 제공합니다.

고려할 점은 각 시스템의 밸런스(재료 수급 난이도, 제작 비용 등)와 플레이어가 복잡함을 느끼지 않도록 도와주는 직관적인 UI 설계가 될 것입니다. 하지만 컨셉 자체는 이미 매우 뛰어나며, 성공적으로 구현된다면 기존에 없던 새로운 재미를 주는 게임이 될 잠재력이 충분합니다.



[대규모 패치 - 미시 세계 시스템 구축]



미시세계란? 아이템, 장비들 같이 게임의 겉으로 잘 드러나지 않지만 게임에 영향을 미치는 그들만이 가지게 되는 생태계를 말함.

메인 시스템(거시 세계)와 달리 독자적인 시스템과 엔진을 가지게 될 것임.



- 필요한 것 : 미세세계를 담을 폴더.

미시세계 게임 엔진

미시세계 아이템 ai 매니저

미시세계 턴 매니저

미시세계 아이템 스탯 매니저

기타 등등 필요한 매니저와 문서, 테스트들.



-앞으로 바뀔 점 : 검과 활, 바이올린 활은 더 이상 단순히 [melee ai] [ranged ai]로 나뉘지 않음.(시스템 혼란을 위해서 밀리, 레인지드 ai 코드 자체는 유지)

각각의 무기에 맞는 ai가 할당될 것. 검=검 ai, 활 = 활 ai, 창 = 창 ai



이는 플레이어, 용병, 몬스터 모두 해당됨.



-왜? 앞으로는 '무기 숙련도'라는 시스템을 패치할 것.



[무기 숙련도]

플레이어,용병,몬스터는 모두 무기 숙련도라는 시스템이 있음.

자신이 어떤 무기에 얼마나 숙달되었는지를 나타내는 수치.(ui안에 모든 무기 항목이 들어있음.)

검 숙련도 1레벨, 이런 식으로 표기.

해당 태그를 가진 무기의 쌓인 경험치도 실시간으로 보여줌.

해당 무기의 경험치를 쌓는 조건, 그 무기를 들고 공격을 한 횟수.(미시세계 턴 매니저?)

숙련도가 높은 무기를 사용할 수록, 그 무기를 이용한 여러가지 기술을 쓸 수 있음.

이 기술은 유닛이 쓰는 기술과 다름. 마나가 들지 않음.

[아이템]이 주체가 되어 쓰는 기술이라고 이해하면 편함.



이렇게 생각하면 됨.



거시세계 = 주체: 플레이어, 용병, 몬스터

미시세계 = 주체 : 장비 아이템, 소모 아이템.



가령 숙련도 1레벨 검으로 사용할 수 있는 가장 기본적인 스킬은, 패링. 낮은 확률로 적의 공격을 쳐냄.

쿨타임이 있음. 30턴. 그리고 이 쿨타임은 플레이어의 쿨타임이 아니라 '무기'의 쿨타임임.

즉, 무기가 주체가 되어 그 기술을 쓰고, 그 쿨타임을 갖는 것.

이를 미시세계 쿨타임이라 부르겠음.



버프형 아티팩트를 사용하면 해당 아티팩트에 쿨타임이 생김. 역시 미시세계 쿨타임임.

소모품 인벤토리 안의 펫은 맵상에서 사망시 쿨타임이 생김. 역시 미시세계 쿨타임.



미시세계에서는 해당 무기가 주체가 되어, 특정 ai를 가짐. 레벨과 경험치를 가지며, 기술과 쿨타임을 가짐. 해당 무기를 쓰는 유닛은 해당 무기의 '수단'이 되는 셈.





무기 창을 사용할 경우 [창 ai]대로 움직이게 됨. 창의 긴 사거리를 통해서 적을 거리를 두며 공격하는 ai와 창의 1레벨 숙련도 기술을 가짐. 1레벨 기술은 '돌진'. 따라서 [무기]가 내킬때마다 해당 유닛은 자신의 의지와 상관없이 적을 향해 돌진하는 ai를 가지게 됨. 이런 느낌임.

각 무기의 ai와 1레벨 숙련도 스킬은 대충 이러함.



검 : 통상적인 근접 ai - 패링(낮은 확률로 공격 무효화)

단검 : 통상적인 근접 ai -백스탭(치명타 높음)

활 : 통상적인 원거리 ai -충전후 발사(더 높은 데미지)

창 : 근접 + 카이팅 ai -돌진

바이올린 활 : 통상적인 원거리 ai - 음파화살

에스톡 : 빠른 이동력을 통해서 적을 찌르고 도망치고, 찌르고 도망치는 히트 앤 런 ai - 돌진

채찍 : 창과 비슷한 중거리 유지 ai - 끌어당기기(대상을 앞으로 당김)



이외에도 아이템이 아이템만의 미시세계 스탯을 갖는 등의 시스템으로 확장해나갈 생각.

---


이 시스템 좀 구현해줘. 일명 [미시세계 전투]야. 일단 미시세계에서의 스탯은 이래.



장비의 내구도 = hp

장비의 무게 = 공격력

장비의 강인함 = 방어력



모든 무기와 방어구는 저 세가지 스탯을 가지고 있음. 두 객체가 싸울 때, 미시세계에서는 저 스탯을 기반으로 힘겨루기가 발생함. 가령 A와 B가 전투를 한다면, A와 B가 가진 장비들 사이에서는 보이지 않는 전투가 발생함. 무기가 방어구를 공격하고, 방어구가 방어함. 그 결과는 이러함.



먼저 내구도가 다 깎인 쪽이 무기일 경우 - 유닛에게서 무기가 튕겨져나감. 무장해제 됨.(전투로그 기록) 맵에 드랍됨.(줏을 수 있음.)

먼저 내구도가 다 깎인 쪽이 방어구일 경우 - 유닛의 방어구가 파괴됨(해당 특수효과와 전투로그).



여기서 좀 까다로운 지점은, A가 B,C와 동시에 대결을 벌인다면, A와 B의 대결 따로, A와 C의 대결이 [독립된 사건]이어야 한다는 점. 두 전투의 데미지가 겹칠 수 있다면 무장해제나 방어구 파괴가 너무 쉽게 일어날듯.



또한 [미시세계의 위계질서]도 있어.



일반 무기는 레어 방어구를 파괴할 수 없음.(반대도 마찬가지

레어 방어구는 유니크 무기를 무장해제할 수 없음.(반대도 마찬가지



이처럼 한 단계 더 높은 등급의 장비에 대해서는 무장해제나 방어구 파괴를 할 수 없음.

---


# Dungeon Crawler Game

This project is a lightweight browser-based dungeon crawler. It lets players explore levels, battle enemies and gather loot directly in the browser.

## Playing

Open `index.html` in a modern web browser to start the game. The player now begins with every available skill already learned, so no class selection is required.

```bash
npx http-server
```

Running a small HTTP server from the project directory is recommended because some browsers block
ES module loading when opening the file directly via `file://`. You can still open `index.html`
without a server, but you may need to adjust browser settings to permit local module imports.

### Dungeon Generation
Each floor is carved from a depth-first search maze. Corridors span seven tiles,
and the exit is placed on a randomly chosen cell that the algorithm visited.

### Monster Progression

As you descend the dungeon, tougher monsters appear on each floor.

- **Floors 1-2** – Goblins, Goblin Archers, Goblin Wizards and Zombies.
- **Floors 3-4** – Skeletons, Skeleton Mages and Orcs (with Orc Archers).
- **Floors 5-6** – Trolls begin to appear alongside Orcs and Skeleton Mages.
- **Floors 7-8** – Dark Mages join the mix with Trolls and Orcs.
- **Floors 9-10** – Demon Warriors lead groups of Dark Mages and Orcs.
- **Beyond floor 10** – ELEMENTAL_GOLEM and other high-level foes may appear.

The full roster of monsters appears on progressively higher floors as defined in
`getMonsterPoolForFloor` in [src/mechanics.js](src/mechanics.js):

- **SLIME** – A weak blob that slowly slides toward the player.
- **KOBOLD** – Crafty scavenger that often attacks in packs.
- **GARGOYLE** – Stone guardian with tough defenses.
- **BANSHEE** – Ethereal spirit whose wail saps life.
- **MINOTAUR** – Brutish beast that charges headfirst.
- **LICH** – Undead sorcerer capable of strong magic.
- **DRAGON_WHELP** – Young dragon with a small but fiery breath.
- **ELEMENTAL_GOLEM** – Massive construct empowered by elemental forces.

### Controls

- Use the arrow keys or on-screen arrows to move your character.
- Press `Z` (or `F`) or click **Attack** to strike the nearest monster.
- Number keys `1`-`9` open the details of each hired mercenary.
- Use the BGM buttons at the top of the page to switch tracks or mute the background music.
- Additional actions such as **Heal**, **Recall**, **Skill1** and **Skill2** are available via the action buttons. You can also use `X` for **Skill1**, `C` for **Skill2**, `V` for **Ranged** attack and `A` to recall your mercenaries.

### Audio

The game uses the Web Audio API for sound effects and plays background music through the `bgm-player` element.
At the top of the page are three BGM controls:
- **prev-bgm** – play the previous track
- **toggle-bgm** – mute or unmute music
- **next-bgm** – play the next track

Audio is not initialized until you interact with the page. The first click or key press runs `initializeAudio()` which starts the sound engine and begins playback.
When tests run under jsdom, audio initialization is skipped so no sound plays.

### Hiring Mercenaries

Click the buttons in the *Hire Mercenary* panel to recruit warriors, archers, healers or wizards. Each mercenary costs gold and appears near the player. You may have up to five mercenaries at a time; when full you will be prompted to replace an existing ally.

### Shop and Skill System

Spend collected gold in the shop to purchase items. Bought gear is placed in your inventory and can boost your stats when equipped. All skills are unlocked from the start and can be assigned to the **Skill1** and **Skill2** slots.
When defining skills, include a numeric `cooldown` property. Passive or always-available skills should set it to `0`.

The newly added **Teleport** skill lets you mark your current position and return to it later. Use it once to save your location, again to warp back and a third time to return to where you warped from.

### Mercenary Skills

Each mercenary receives one random skill upon hiring. Using that skill costs the
mercenary's mana, and the skill's name and icon show up in the combat log when
activated. You can see the assigned skill and its mana cost in the mercenary's
detail panel and in the side list by their portrait. Open a mercenary's detail
panel with the corresponding number key (`1`-`9`) or by clicking their portrait
in the UI.

### Bard Mercenaries

Bards are support units that join with songs ready to boost the party. Each bard
comes with one of two skill sets:

- **Heal** + **Guardian Hymn**
- **Heal** + **Courage Hymn**

These hymns play `auraActivateMinor` or `auraActivateMajor` sound cues when
activated, letting you know their protective or offensive effects are in play.

### Summoner Mercenaries

Summoners command undead minions to fight for you. They know the **Summon Skeleton** skill
and can control up to two minions at a time.

### Mercenary Traits

*This system has been removed.* Mercenaries no longer receive random traits or related bonuses.

### Mercenary Affinity (호감도 시스템)

Mercenaries and revived monsters track an *affinity* value that measures their
loyalty to the party.

- Newly hired mercenaries start with **50** affinity.
- Revived monsters start with **30** affinity.
- Affinity rises by **0.01** each turn a unit stays in your party and caps at **200**.
- When a mercenary dies they lose **5** affinity. If their affinity drops to zero
  they permanently leave your party.

You can view a unit's current affinity by opening their detail window. The value
appears near the top of the stats panel.

#### Food and Cooking

Food items increase affinity. Simple drops like **Bread** provide small bonuses
(+3 affinity), while cooked dishes from the **Crafting** tab grant larger
amounts. For example, combining Bread, Meat and Lettuce into a **Sandwich** yields
**+3** affinity and fullness.

Ingredient items and cooking recipes drop randomly during exploration and are
stored as crafting materials rather than in your main inventory.

### Elite Monsters and Auras

Each dungeon floor now contains at least one **elite** monster. Elites boast higher stats and randomly receive an aura skill that benefits nearby allies. When an elite is revived as a mercenary, it keeps this aura skill. Elites display a red glow and the "엘리트" prefix. Champions glow yellow, and superior monsters glow blue.

#### Superior Rank

Superior elites are a planned upgrade to normal elites. They carry two aura skills and gain strength through a star-based system. They are not yet part of the regular dungeon spawns.

### Incubators

Incubators let you hatch monster eggs into powerful allies. Place an egg from your inventory into an empty slot to start the process. Each egg shows how many turns remain until hatching. At the start of every turn the counter decreases. When an egg reaches zero, the hatched superior is moved to the waiting list. Recruit them from there to add the new mercenary to your party.

### Loot

Recipe scrolls may drop from monsters or appear in dungeons. Picking one up automatically adds the recipe to your known list. Duplicate scrolls are ignored once learned.

### Monster Farming

You can now cultivate monsters for equipment. Bury a defeated foe on a farm tile to start growing loot. The monster slowly decomposes over a set number of turns. Using fertilizer items reduces this time or improves the drop quality. When the growth is complete, harvest the plot to receive equipment influenced by the planted monster.

### Equipment Enhancement

Gear can be leveled up using materials like **iron** and **bone**. Each enhancement level adds **+1** to attack and defense, **+0.5** to other non-resistance stats, and **+0.01** to resistance stats. Press the **강화** button beside an item in your inventory to spend the materials and apply the upgrade. Players now begin the game with **100** iron and **100** bone so you can enhance equipment right away.
Each attempt has a 20% chance to fail, which still consumes the materials but does not increase the item's level.

### Disassembling Gear

Equipment can be broken down for extra materials. Click the **분해** button next to a weapon, armor or accessory to dismantle it. You gain both **iron** and **bone** equal to the item's base level plus its enhancement level. The item is removed from your inventory after disassembly.

### Leeching and Vampirism Bonuses

Some equipment suffixes grant special `killHealth` or `killMana` modifiers. Gear with the **Leeching** suffix restores health to whoever lands the killing blow, while the **Vampirism** suffix replenishes mana on a kill. These bonuses provide a steady trickle of recovery as you defeat enemies.

### Special Tiles

Dungeon floors contain several interactive tiles:

- **Treasure Chests** scatter 1–5 random items around them when opened.
- **Mines** grant large amounts of **iron**.
- **Trees** provide plenty of **wood**.
- **Bone Piles** yield lots of **bone**.
- **Temples** come in three colors and either fully heal the party, restore fullness or raise affinity by 10. Each temple disappears after use.
- **Graves** present a risky challenge. Accepting it spawns monsters but rewards high level items, materials and gold.

### Map Items and Altars

Map items occasionally drop from monsters and chests. Each map lists a modifier that alters the next floor, such as boosting treasure or increasing monster spawns. Every five floors a glowing map altar appears in the dungeon. Stand on the altar and activate a map from your inventory to apply its modifier – maps only work when used while positioned on these altars.

## Development

Install dependencies with:

```bash
npm install
```

The core `gameState` object used throughout the game is created in
[`src/state.js`](src/state.js) and is attached to the global object so
other modules such as `src/mechanics.js` can access it directly.

## Testing

The test suite relies on development dependencies such as **jsdom**. Ensure they
are installed by running:

```bash
npm install
```

You can simply run `npm test` as well – the `pretest` script in
`package.json` automatically installs all dependencies before executing the test
runner. After installation the test runner
automatically locates all files ending with `*.test.js` in the `tests` folder
and executes them sequentially.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Contributing

Pull requests and issues are welcome. Please follow common open source etiquette when proposing changes.
