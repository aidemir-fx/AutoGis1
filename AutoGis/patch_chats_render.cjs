const fs = require('fs');
const path = './AutoGis/src/screens/cabinet/Chats/Chats.tsx';
let content = fs.readFileSync(path, 'utf-8');

if (!content.includes('SupportChat')) {
    content = 'import { SupportChat } from "@modules/chats/components/SupportChat";\n' + content;
    
    // Replace the rendering block for the current tab
    content = content.replace(
        '{activeTab === "ordinary" && renderOrdinaryTab()}',
        '{activeTab === "ordinary" && renderOrdinaryTab()}\n                    {activeTab === "support" && <SupportChat />}'
    );
    
    // Also, handle the case where "support" doesn't have a list view, we just render it.
    // wait, in mobile, Chats.tsx manages activeView ("list" vs "chat").
    // If activeTab is "support", we should just render SupportChat and bypass the list.
    
    content = content.replace(
        'if (isMobile && activeView === "chat" && activeChatOrderId) {',
        'if (isMobile && activeTab === "support") {\n        return (\n            <Box height="calc(100vh - 120px)">\n                <SupportChat />\n            </Box>\n        );\n    }\n\n    if (isMobile && activeView === "chat" && activeChatOrderId) {'
    );

    fs.writeFileSync(path, content, 'utf-8');
}
