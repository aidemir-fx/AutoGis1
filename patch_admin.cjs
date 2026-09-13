const fs = require('fs');
const path = './AutoGis/src/screens/admin/ModerationQueuePage.tsx';
let content = fs.readFileSync(path, 'utf-8');

if (!content.includes('AdminNotificationForm')) {
    content = content.replace(
        'import { AdminShell } from "../../components/admin/AdminShell";',
        'import { AdminShell } from "../../components/admin/AdminShell";\nimport { AdminNotificationForm } from "../../components/AdminNotificationForm";'
    );
    
    // Fallback if the first replacement didn't find the exact string
    if (!content.includes('AdminNotificationForm')) {
        content = 'import { AdminNotificationForm } from "../../components/AdminNotificationForm";\n' + content;
    }

    content = content.replace(
        '<Stack spacing={2}>',
        '<Stack spacing={2}>\n                    <AdminNotificationForm />'
    );
}

fs.writeFileSync(path, content, 'utf-8');
console.log('Patched ModerationQueuePage.tsx successfully');
