const fs = require('fs');
const path = require('path');

const filepath = path.resolve(process.cwd, process.argv[2]);

console.log(`reading ${filepath}`);

const arraybuffer = fs.readFileSync(filepath);

const signature = readAsString(arraybuffer, 0, 4);

if (signature !== 'LASF') {
    console.error('not a proper las file');
    process.exit(1);
}

// using spec https://www.asprs.org/wp-content/uploads/2010/12/LAS_1_4_r13.pdf
const versionMajor = arraybuffer.slice(4 + 2 + 2 + 4 + 2 + 2 + 8, 4 + 2 + 2 + 4 + 2 + 2 + 8 + 1)[0];
const versionMinor = arraybuffer.slice(4 + 2 + 2 + 4 + 2 + 2 + 8 + 1, 4 + 2 + 2 + 4 + 2 + 2 + 8 + 1 + 1)[0];
console.log(`Las version is ${versionMajor}.${versionMinor}`)
// headerSize is at 94
// point data offset is at 96
const headerSize = readAsTypedArray(arraybuffer, Uint16Array, 94);
const vlrCount = readAsTypedArray(arraybuffer, Uint16Array, 100);

let currentOffset = headerSize;
const vlrEntries = [];
for (let i = 0; i < vlrCount; i++) {
    // parsing vlr header
    currentOffset = currentOffset + 2; // reserved for unsigned short
    const userId = readAsString(arraybuffer, currentOffset, 16); // char[16]
    currentOffset += 16;
    const recordId = readAsTypedArray(arraybuffer, Uint16Array, currentOffset); // unsigned short
    currentOffset += 2;
    const recordLength = readAsTypedArray(arraybuffer, Uint16Array, currentOffset); // unsigned short
    currentOffset += 2;
    const description = readAsString(arraybuffer, currentOffset, 32); // char[32]
    currentOffset += 32;
    let data;
    if (description.includes('GeoKeyDirectoryTag')) {
        const geoKeyDirectory = {};
        geoKeyDirectory.wKeyDirectoryVersion = readAsTypedArray(arraybuffer, Uint16Array, currentOffset);
        currentOffset += 2;
        geoKeyDirectory.wKeyRevision = readAsTypedArray(arraybuffer, Uint16Array, currentOffset);
        currentOffset += 2;
        geoKeyDirectory.wKeyMinorRevision = readAsTypedArray(arraybuffer, Uint16Array, currentOffset);
        currentOffset += 2;
        geoKeyDirectory.wKeyNumberOfKeys = readAsTypedArray(arraybuffer, Uint16Array, currentOffset);
        currentOffset += 2;

        for (let j = 0; j < geoKeyDirectory.wKeyNumberOfKeys; j++) {
            if (!geoKeyDirectory.keyEntries) {
                geoKeyDirectory.keyEntries = [];
            }
            const keyEntry = {};
            keyEntry.wKeyId = readAsTypedArray(arraybuffer, Uint16Array, currentOffset);
            currentOffset += 2;
            keyEntry.wTIFFTagLocation= readAsTypedArray(arraybuffer, Uint16Array, currentOffset);
            currentOffset += 2;
            keyEntry.wCount = readAsTypedArray(arraybuffer, Uint16Array, currentOffset);
            currentOffset += 2;
            keyEntry.wValue_Offset = readAsTypedArray(arraybuffer, Uint16Array, currentOffset);
            currentOffset += 2;

            geoKeyDirectory.keyEntries.push(keyEntry);
        }

        data = geoKeyDirectory;
    } else {
        data = readAsString(arraybuffer, currentOffset,  recordLength); 
        currentOffset += recordLength;
    }

    vlrEntries.push({
        userId,
        recordId,
        recordLength,
        description,
        data
    });
}

console.log(JSON.stringify(vlrEntries, "\"", 2));

function readAsTypedArray (buf, Type, offset) {
	let sub = buf.slice(offset, offset + Type.BYTES_PER_ELEMENT);

	let r = new Type(sub);

    return r.reduce((result, byte, index) => {
        return result + Math.pow(255, index) * byte;    
    }, 0);
};

function readAsString(buf, offset, length) {
    const slice = buf.slice(offset, offset + length);
    const result = Array.from(slice).map(e => {
        const char = String.fromCharCode(e);
        if (char === '\u0000') {
            return '';
        }

        return char;
    }).join('');

    return result;
};
