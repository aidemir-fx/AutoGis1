const fs = require('fs');
const path = './AutoGis/src/modules/layout/features/PageLayout/Header/Header.tsx';
let content = fs.readFileSync(path, 'utf-8');

if (!content.includes('NotificationBell')) {
    content = content.replace(
        'import { User } from "./User";',
        'import { User } from "./User";\nimport { NotificationBell } from "../../../../../components/NotificationBell";'
    );

    content = content.replace(
        '<UserPartWrpapper onClick={handleUserMenuClick}>',
        '<NotificationBell isAdmin={profile?.role === "ADMIN" || profile?.role === "admin"} />\n                                    <UserPartWrpapper onClick={handleUserMenuClick}>'
    );
    
    fs.writeFileSync(path, content, 'utf-8');
    console.log('Patched Header.tsx successfully');
}
