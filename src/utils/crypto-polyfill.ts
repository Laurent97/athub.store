// Crypto polyfill for browser compatibility
// This fixes crypto.randomUUID errors in older browsers and some extension contexts

if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
  (crypto as any).randomUUID = function() {
    // Generate a random UUID v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
}

// Alternative fallback if crypto is completely undefined
if (typeof crypto === 'undefined') {
  (window as any).crypto = {
    randomUUID: function() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },
    getRandomValues: function(array: Uint8Array) {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }
  };
}

export {};
