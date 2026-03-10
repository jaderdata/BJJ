import fs from 'fs';
import path from 'path';

function replaceInDir(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            replaceInDir(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.css')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('emerald')) {
                const newContent = content.replace(/emerald/g, 'amber');
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

replaceInDir('./src');
console.log('Done!');
