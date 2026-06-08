const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const allTsFiles = [];
walkDir(path.join(__dirname, '../backend/src'), function(filePath) {
    if (filePath.endsWith('.ts')) {
        allTsFiles.push(filePath);
    }
});

const entityClasses = {};

allTsFiles.forEach(file => {
    if (file.endsWith('.entity.ts')) {
        const content = fs.readFileSync(file, 'utf8');
        const classMatch = content.match(/export class (\w+)/);
        if (classMatch) {
            entityClasses[classMatch[1]] = file;
        }
    }
});

const unusedEntities = [];

for (const [className, file] of Object.entries(entityClasses)) {
    let isUsed = false;
    for (const tsFile of allTsFiles) {
        if (tsFile === file) continue; // Skip the entity file itself
        
        const content = fs.readFileSync(tsFile, 'utf8');
        
        // Exclude its own module or places where it's just imported to TypeOrmModule.forFeature
        // Let's check if there's any reference that isn't just an import or TypeOrmModule
        if (content.includes(className)) {
            // Check if it's used in InjectRepository or as a type somewhere that is not a module
            if (tsFile.endsWith('.service.ts') || tsFile.endsWith('.controller.ts') || tsFile.endsWith('.resolver.ts')) {
                isUsed = true;
                break;
            }
            if (content.includes('InjectRepository(' + className + ')')) {
                isUsed = true;
                break;
            }
        }
    }
    
    if (!isUsed) {
        unusedEntities.push(className);
    }
}

fs.writeFileSync(path.join(__dirname, 'unused_entities.json'), JSON.stringify(unusedEntities, null, 2));
console.log('Done finding unused entities');
