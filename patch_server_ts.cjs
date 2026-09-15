const fs = require('fs');
const path = './AutoGis/AutoGis/server.ts';
let content = fs.readFileSync(path, 'utf-8');

const supportMockRoutes = `
    // Mock Support Chat
    const supportMessages = [];
    app.get("/api/support/chat", (req, res) => {
        const userId = req.query.userId || "mock-user-id";
        res.json(supportMessages.filter(m => m.userId === userId));
    });
    
    app.post("/api/support/chat", (req, res) => {
        const { message, userId } = req.body;
        const targetId = userId || "mock-user-id";
        const newMsg = {
            id: \`supp-\${Date.now()}\`,
            userId: targetId,
            senderId: userId ? "admin" : targetId, // If admin replies, sender is admin
            message: message || "",
            isRead: false,
            createdAt: new Date().toISOString()
        };
        supportMessages.push(newMsg);
        res.json(newMsg);
    });

    app.get("/api/support/chats", (req, res) => {
        // Return grouped mock summaries
        const summaries = [];
        if (supportMessages.length > 0) {
            summaries.push({
                userId: "mock-user-id",
                userName: "Тестовый Пользователь",
                userPhone: "+7 999 000 00 00",
                lastMessage: supportMessages[supportMessages.length - 1].message,
                lastMessageAt: supportMessages[supportMessages.length - 1].createdAt,
                unreadCount: supportMessages.filter(m => !m.isRead).length
            });
        }
        res.json(summaries);
    });

    app.get("/api/support/unread-count", (req, res) => {
        res.json({ count: supportMessages.filter(m => !m.isRead).length });
    });
`;

if (!content.includes('/api/support/chat')) {
    content = content.replace(
        'app.get("/api/chat-messages/unread-count"',
        supportMockRoutes + '\n    app.get("/api/chat-messages/unread-count"'
    );
    fs.writeFileSync(path, content, 'utf-8');
    console.log("Patched server.ts successfully");
} else {
    console.log("Already patched");
}
