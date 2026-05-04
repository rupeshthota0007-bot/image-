import CryptoJS from 'crypto-js';

const MAGIC_HEADER = "STEG";

/**
 * Encrypts a message using AES.
 */
export const encryptMessage = (message, key) => {
  return CryptoJS.AES.encrypt(message, key).toString();
};

/**
 * Decrypts a message using AES.
 */
export const decryptMessage = (ciphertext, key) => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    if (!originalText) return null;
    return originalText;
  } catch (e) {
    return null;
  }
};

/**
 * Converts a string to a bit array.
 */
const stringToBits = (str) => {
  const bits = [];
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    for (let j = 7; j >= 0; j--) {
      bits.push((charCode >> j) & 1);
    }
  }
  return bits;
};

/**
 * Converts a 32-bit integer to bits.
 */
const uint32ToBits = (num) => {
  const bits = [];
  for (let i = 31; i >= 0; i--) {
    bits.push((num >> i) & 1);
  }
  return bits;
};

/**
 * Converts bits to a 32-bit integer.
 */
const bitsToUint32 = (bits) => {
  let num = 0;
  for (let i = 0; i < 32; i++) {
    num = (num << 1) | bits[i];
  }
  return num >>> 0; // Ensure unsigned
};

/**
 * Converts a bit array to a string.
 */
const bitsToString = (bits) => {
  let str = "";
  for (let i = 0; i < bits.length; i += 8) {
    let charCode = 0;
    for (let j = 0; j < 8; j++) {
      charCode = (charCode << 1) | bits[i + j];
    }
    str += String.fromCharCode(charCode);
  }
  return str;
};

/**
 * Encodes a message into a canvas.
 */
export const encodeDataInCanvas = (canvas, message, key) => {
  const encrypted = encryptMessage(message, key);
  const payload = encrypted;
  const payloadBits = stringToBits(payload);
  
  const headerBits = stringToBits(MAGIC_HEADER);
  const lengthBits = uint32ToBits(payloadBits.length);
  
  const allBits = [...headerBits, ...lengthBits, ...payloadBits];

  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Each pixel has 3 usable channels (RGB).
  if (allBits.length > (data.length * 3) / 4) {
    throw new Error(`Message too long. Image can hold ~${Math.floor((data.length * 3) / 32)} characters.`);
  }

  let bitIndex = 0;
  for (let i = 0; i < data.length && bitIndex < allBits.length; i++) {
    if ((i + 1) % 4 === 0) continue; // Skip Alpha
    data[i] = (data[i] & 0xFE) | allBits[bitIndex];
    bitIndex++;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
};

/**
 * Decodes a message from a canvas.
 */
export const decodeDataFromCanvas = (canvas, key) => {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const extractBits = (count, startOffset) => {
    const bits = [];
    let bitsCollected = 0;
    let currentDataIdx = 0;
    let currentBitIdx = 0;

    while (bitsCollected < count + startOffset) {
      if ((currentDataIdx + 1) % 4 !== 0) {
        if (currentBitIdx >= startOffset) {
          bits.push(data[currentDataIdx] & 1);
          bitsCollected++;
        } else {
          currentBitIdx++;
        }
      }
      currentDataIdx++;
      if (currentDataIdx >= data.length) break;
    }
    return bits;
  };

  // 1. Extract Magic Header (4 bytes = 32 bits)
  const headerBits = extractBits(32, 0);
  const header = bitsToString(headerBits);
  if (header !== MAGIC_HEADER) return null;

  // 2. Extract Length (4 bytes = 32 bits)
  const lengthBits = extractBits(32, 32);
  const payloadBitLength = bitsToUint32(lengthBits);

  if (payloadBitLength > data.length * 3) return null;

  // 3. Extract Payload
  const payloadBits = extractBits(payloadBitLength, 64);
  const encryptedPayload = bitsToString(payloadBits);

  return decryptMessage(encryptedPayload, key);
};
