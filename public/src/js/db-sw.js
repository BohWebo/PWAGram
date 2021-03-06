var dbPromise = idb.open('posts-store', 1, (db) => {
    if (!db.objectStoreNames.contains('posts')) {
        db.createObjectStore('posts', {keyPath: 'id'});
    }
});

async function writeDataToDB(st, data) {
    const db = await dbPromise;
    const tx = db.transaction(st, 'readwrite');
    const store = tx.objectStore(st);
    store.put(data);

    return tx.complete;
}

async function getAllDataFromDB(st) {
    const db = await dbPromise;
    const tx = db.transaction(st, 'readonly');
    const store = tx.objectStore(st);

    return store.getAll();
}

async function clearAllData(st) {
    const db = await dbPromise;
    const tx = db.transaction(st, 'readwrite');
    const store = tx.objectStore(st);
    store.clear();

    return tx.complete;
}

async function deleteItemById(st, id) {
    const db = await dbPromise;
    const tx = db.transaction(st, 'readwrite');
    const store = tx.objectStore(st);
    store.delete(id);

    return tx.complete;
}



