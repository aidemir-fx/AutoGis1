const fs = require('fs');
const path = './AutoGis/src/components/NotificationListener.tsx';
let content = fs.readFileSync(path, 'utf-8');

if (!content.includes('support/unread-count')) {
    content = 'import { playNotificationSound } from "@common/lib/sound";\n' + content;
    
    // Replace the fetch block to also check support unreads
    const newFetch = `
        const fetchNotifications = async () => {
            try {
                // Fetch regular notifications
                const role = userRole === 'ADMIN' ? 'admin_all' : userRole;
                const res = await fetch(\`/api/notifications?role=\${role}\`);
                if (res.ok) {
                    const data = await res.json();
                    
                    const lastId = parseInt(localStorage.getItem(LAST_NOTIFICATION_KEY) || '0', 10);
                    let maxId = lastId;

                    data.forEach((n: any) => {
                        if (n.id > lastId) {
                            toast.info(n.message, { autoClose: false });
                            if (n.id > maxId) {
                                maxId = n.id;
                            }
                        }
                    });

                    if (maxId > lastId) {
                        localStorage.setItem(LAST_NOTIFICATION_KEY, maxId.toString());
                        playNotificationSound();
                    }
                }

                // Fetch support unread count
                const supportRes = await fetch(\`/api/support/unread-count\`, {
                    headers: { 'Authorization': \`Bearer \${localStorage.getItem('accessToken')}\` }
                });
                if (supportRes.ok) {
                    const supportData = await supportRes.json();
                    const currentUnread = supportData.count || 0;
                    const prevUnread = parseInt(localStorage.getItem('autogis_support_unread') || '0', 10);
                    
                    if (currentUnread > prevUnread && currentUnread > 0) {
                        toast.success("Новое сообщение в поддержке!", {
                            onClick: () => window.location.href = '/cabinet/chats?tab=support'
                        });
                        playNotificationSound();
                    }
                    localStorage.setItem('autogis_support_unread', currentUnread.toString());
                }

            } catch (error) {
                console.error("Failed to fetch notifications", error);
            }
        };
`;
    content = content.replace(/const fetchNotifications = async \(\) => \{[\s\S]*?\};\n/m, newFetch);
    fs.writeFileSync(path, content, 'utf-8');
}
