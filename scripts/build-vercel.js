const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'public');

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

for (const file of ['index.html', 'payment.html']) {
    fs.copyFileSync(path.join(root, file), path.join(output, file));
}

for (const directory of ['css', 'js', 'img']) {
    fs.cpSync(path.join(root, directory), path.join(output, directory), {
        recursive: true
    });
}

console.log('Vercel static build created in public/');
