Read Variable Length Records (VLR) of a LAS formatted point cloud. VLR is often used to store projection data. Usage: 
In browser
```javascript
// Callback from a <input type="file" onchange="onChange(event)">
function onChange(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
        const arraybuffer = e.target.result;
        const vlrEntries = window.readLASVLR(new Uint8Array(arraybuffer));

        console.log(vlrEntries);
    }; 
    reader.readAsArrayBuffer(file); 
}
```

In nodejs
```javascript
const { readLASVLR } = require(/path/to/repo/index.js');

const filePath = '/path/to/las/file.las';

const buffer = fs.readFileSync(filePath);

const vlrEntries = readLASVLR(buffer);

console.log(vlrEntries);
```
