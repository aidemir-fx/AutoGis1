const fs = require('fs');
const path = './AutoGis/src/screens/cabinet/Chats/Chats.tsx';
let content = fs.readFileSync(path, 'utf-8');

if (!content.includes('AdminSupportList')) {
    content = 'import { AdminSupportList } from "@modules/chats/components/AdminSupportList";\n' + content;
    
    content = content.replace(
        '{activeTab === "support" && <SupportChat />}',
        '{activeTab === "support" && (profile?.role === "ADMIN" || profile?.role === "MODERATOR" ? <AdminSupportList /> : <SupportChat />)}'
    );
    
    content = content.replace(
        'if (isMobile && activeTab === "support") {\n        return (\n            <Box height="calc(100vh - 120px)">\n                <SupportChat />\n            </Box>\n        );\n    }',
        'if (isMobile && activeTab === "support") {\n        return (\n            <Box height="calc(100vh - 120px)">\n                {profile?.role === "ADMIN" || profile?.role === "MODERATOR" ? <AdminSupportList /> : <SupportChat />}\n            </Box>\n        );\n    }'
    );

    fs.writeFileSync(path, content, 'utf-8');
}
