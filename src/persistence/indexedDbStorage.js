export function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('tile_crawler', 1);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('saves')) {
                db.createObjectStore('saves');
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export function putSave(db, key, data) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction('saves', 'readwrite');
        tx.objectStore('saves').put(data, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export function getSave(db, key) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction('saves', 'readonly');
        const req = tx.objectStore('saves').get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}
