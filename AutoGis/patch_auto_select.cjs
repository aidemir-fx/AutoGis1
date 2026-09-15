const fs = require('fs');
const path = './AutoGis/AutoGis/src/screens/cabinet/Chats/Chats.tsx';
let content = fs.readFileSync(path, 'utf-8');

// Replace the block that auto-selects the first chat
content = content.replace(
`        if (!selectedOrderId) {
            if (!isMobile) {
                setSelectedOrderId(activeOrders[0].id);
                setView("chat");
            }
            return;
        }`,
`        if (!selectedOrderId) {
            setView("list");
            return;
        }`
);

// Also replace the fallback logic if selected chat disappears
content = content.replace(
`        const hasSelected = activeOrders.some((order) => order.id === selectedOrderId);
        if (!hasSelected) {
            setSelectedOrderId(isMobile ? null : activeOrders[0].id);
            setView("list");
        }`,
`        const hasSelected = activeOrders.some((order) => order.id === selectedOrderId);
        if (!hasSelected) {
            setSelectedOrderId(null);
            setView("list");
        }`
);

fs.writeFileSync(path, content, 'utf-8');
console.log('patched successfully');
