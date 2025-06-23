import tfLoader from '../../utils/tf-loader.js';

export class MbtiEngine {
    constructor(eventManager, options = {}) {
        if (!eventManager) {
            throw new Error('MbtiEngine requires an EventManager');
        }
        this.eventManager = eventManager;
        this.cooldown = 120; // 2 seconds at 60fps

        this.model = null;
        this.modelLoaded = false;
        this.tf = null;
        this.coco = null;
        this.knn = null;
        tfLoader.init().then(() => {
            this.tf = tfLoader.getTf();
            this.coco = tfLoader.cocoSsd;
            this.knn = tfLoader.knnClassifier;
        }).catch(err => {
            console.warn('[MbtiEngine] Failed to initialize TensorFlow libraries:', err);
        });

        if (options.model) {
            this.model = options.model;
            this.modelLoaded = true;
        }
        if (options.modelUrl) {
            this.loadModel(options.modelUrl).catch(err => {
                console.warn('[MbtiEngine] Failed to load model:', err);
            });
        }
        console.log('[MbtiEngine] Initialized');
    }

    async loadModel(url) {
        await tfLoader.init();
        const tf = this.tf || tfLoader.getTf();
        this.model = await tf.loadLayersModel(url);
        this.modelLoaded = true;
        console.log(`[MbtiEngine] Model loaded from ${url}`);
    }

    _buildInput(entity, action) {
        const allyCount = action.context?.allies?.length || 0;
        return [
            action.type === 'attack' ? 1 : 0,
            action.type === 'move' ? 1 : 0,
            allyCount
        ];
    }

    _predictTrait(entity, action) {
        const tf = this.tf;
        if (!tf || !this.modelLoaded) return null;
        const tensor = tf.tensor2d([this._buildInput(entity, action)]);
        const prediction = this.model.predict(tensor);
        const traitIndex = prediction.argMax(-1).dataSync()[0];
        tf.dispose([tensor, prediction]);
        const traits = ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'];
        return traits[traitIndex] || null;
    }

    /**
     * 유닛의 행동과 MBTI를 분석하여 특성 발동 이벤트를 발생시킵니다.
     * @param {object} entity - AI 유닛
     * @param {object} action - AI가 결정한 행동
     */
    process(entity, action) {
        if (!entity || !action || !entity.properties?.mbti) {
            return;
        }

        // 쿨다운 체크
        if (entity._mbtiCooldown > 0) {
            entity._mbtiCooldown--;
            return;
        }

        const mbti = entity.properties.mbti;
        const predictedTrait = this._predictTrait(entity, action);
        let traitToPublish = predictedTrait;
        let tfUsed = !!predictedTrait;

        // 기존 규칙 기반 판단(백업)
        if (!traitToPublish) {
            switch (action.type) {
                case 'attack':
                case 'skill':
                    if (action.target?.isFriendly === false) {
                        if (mbti.includes('T')) traitToPublish = 'T';
                        else if (mbti.includes('F')) traitToPublish = 'F';
                    } else if (action.target?.isFriendly === true) {
                        if (mbti.includes('F')) traitToPublish = 'F';
                    }

                    if (!traitToPublish && mbti.includes('S')) traitToPublish = 'S';
                    break;

                case 'move':
                    if (action.target) {
                        if (mbti.includes('J')) traitToPublish = 'J';
                    } else {
                        if (mbti.includes('P')) traitToPublish = 'P';
                    }
                    break;

                case 'idle':
                case 'flee':
                    if (mbti.includes('I')) traitToPublish = 'I';
                    break;
            }
        }

        // E/I는 별도 조건으로 한 번 더 체크 (주변 유닛 수)
        if (!traitToPublish && action.context?.allies) {
            if (action.context.allies.length > 3 && mbti.includes('E')) {
                traitToPublish = 'E';
            }
        }

        if (traitToPublish) {
            this.eventManager.publish('ai_mbti_trait_triggered', {
                entity,
                trait: traitToPublish,
                tfUsed
            });
            entity._mbtiCooldown = this.cooldown;
        }
    }
}
