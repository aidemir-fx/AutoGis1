const fs = require('fs');
const path = './AutoGis/src/modules/chats/hooks/useRealtimeChat.ts';
let content = fs.readFileSync(path, 'utf-8');

if (!content.includes('playNotificationSound')) {
    content = 'import { playNotificationSound } from "@common/lib/sound";\n' + content;
    content = content.replace(
        'if (envelope.event === "new_order_message") {',
        'if (envelope.event === "new_order_message") {\n            playNotificationSound();'
    );
    fs.writeFileSync(path, content, 'utf-8');
}
