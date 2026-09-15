const fs = require('fs');
const path = './AutoGis/src/screens/cabinet/Chats/Chats.tsx';
let content = fs.readFileSync(path, 'utf-8');

content = content.replace(
    'type ChatTab = "ordinary" | "professional" | "archive";',
    'type ChatTab = "ordinary" | "professional" | "archive" | "support";'
);

content = content.replace(
    '<Tab value="archive" label="Архив" />',
    '<Tab value="archive" label="Архив" />\n                            <Tab value="support" label="Поддержка" />'
);

fs.writeFileSync(path, content, 'utf-8');
