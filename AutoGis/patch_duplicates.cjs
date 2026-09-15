const fs = require('fs');
const path = './AutoGis/AutoGis/src/modules/chats/components/SupportChat.tsx';
let content = fs.readFileSync(path, 'utf-8');

// Replace duplicate-prone WS handler
content = content.replace(
`                        setMessages((prev) => [...prev, envelope.data as SupportMessage]);`,
`                        setMessages((prev) => {
                            if (prev.some(m => m.id === envelope.data.id)) return prev;
                            return [...prev, envelope.data as SupportMessage];
                        });`
);

// Add duplicate prevention to http.post as well just in case
content = content.replace(
`            // We append immediately for snappy UI
            setMessages((prev) => [...prev, res.data]);`,
`            // We append immediately for snappy UI
            setMessages((prev) => {
                if (prev.some(m => m.id === res.data.id)) return prev;
                return [...prev, res.data];
            });`
);

fs.writeFileSync(path, content, 'utf-8');
console.log('patched duplicates successfully');
