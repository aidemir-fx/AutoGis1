const fs = require('fs');
const path = './AutoGis/backend/cmd/server/main.go';
let content = fs.readFileSync(path, 'utf-8');

if (!content.includes('supportChatHandler := handler.NewSupportChatHandler(db, hub)')) {
    content = content.replace(
        'notificationHandler := handler.NewNotificationHandler(db)',
        'notificationHandler := handler.NewNotificationHandler(db)\n\tsupportChatHandler := handler.NewSupportChatHandler(db, hub)'
    );

    content = content.replace(
        'notificationHandler *handler.NotificationHandler,\n\tjwtService *jwt.JWTService,',
        'notificationHandler *handler.NotificationHandler,\n\tsupportChatHandler *handler.SupportChatHandler,\n\tjwtService *jwt.JWTService,'
    );

    content = content.replace(
        'notificationHandler, jwtService,',
        'notificationHandler, supportChatHandler, jwtService,'
    );

    const supportRoutes = `
	// Support Chat routes
	apiGroup.GET("/support/chat", supportChatHandler.GetMyChat)
	apiGroup.POST("/support/chat", supportChatHandler.SendMessage)
	apiGroup.GET("/support/chats", supportChatHandler.GetAllChats)
	apiGroup.GET("/support/unread-count", supportChatHandler.GetUnreadCount)
`;
    content = content.replace(
        'apiGroup.GET("/activity-types", searchHandler.GetActivityTypes)',
        supportRoutes + '\n\t\tapiGroup.GET("/activity-types", searchHandler.GetActivityTypes)'
    );

    fs.writeFileSync(path, content, 'utf-8');
    console.log('Patched main.go successfully');
}
