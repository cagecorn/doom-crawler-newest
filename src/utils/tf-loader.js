export async function loadTf() {
    if (loadTf.tfPromise) return loadTf.tfPromise;

    if (typeof window !== 'undefined') {
        if (window.tf) {
            loadTf.tfPromise = Promise.resolve(window.tf);
        } else {
            loadTf.tfPromise = import('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.es2017.js')
                .then(mod => {
                    window.tf = mod;
                    return mod;
                })
                .catch(err => {
                    console.warn('[tf-loader] Failed to load TensorFlow.js', err);
                    throw err;
                });
        }
    } else {
        loadTf.tfPromise = import('@tensorflow/tfjs');
    }

    return loadTf.tfPromise;
}

export async function loadCocoSsd() {
    if (!loadCocoSsd.promise) {
        if (typeof window !== 'undefined') {
            loadCocoSsd.promise = import(
                'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.esm.js'
            ).catch(err => {
                console.warn('[tf-loader] Failed to load coco-ssd', err);
                throw err;
            });
        } else {
            loadCocoSsd.promise = import('@tensorflow-models/coco-ssd');
        }
    }
    return loadCocoSsd.promise;
}

export async function loadKnnClassifier() {
    if (!loadKnnClassifier.promise) {
        if (typeof window !== 'undefined') {
            loadKnnClassifier.promise = import(
                'https://cdn.jsdelivr.net/npm/@tensorflow-models/knn-classifier@1.2.6/dist/knn-classifier.esm.js'
            ).catch(err => {
                console.warn('[tf-loader] Failed to load knn-classifier', err);
                throw err;
            });
        } else {
            loadKnnClassifier.promise = import('@tensorflow-models/knn-classifier');
        }
    }
    return loadKnnClassifier.promise;
}
