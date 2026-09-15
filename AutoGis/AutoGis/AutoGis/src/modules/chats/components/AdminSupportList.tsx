import React, { useState, useEffect } from "react";
import { Box, Typography, List, ListItem, ListItemText, ListItemAvatar, Avatar, Badge, CircularProgress, Divider } from "@mui/material";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import { http } from "@common/lib/http";
import dayjs from "dayjs";
import { SupportChat } from "./SupportChat";

interface SupportChatSummary {
    userId: string;
    userName: string;
    userPhone: string;
    lastMessage: string;
    lastMessageAt: string;
    unreadCount: number;
}

export const AdminSupportList = () => {
    const [summaries, setSummaries] = useState<SupportChatSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const res = await http.get("/support/chats");
                setSummaries(res.data);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchChats();
        
        // Simple polling for updates
        const interval = setInterval(fetchChats, 10000);
        return () => clearInterval(interval);
    }, []);

    if (selectedUser) {
        return (
            <Box height="100%" display="flex" flexDirection="column">
                <Box p={1}>
                    <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }} onClick={() => setSelectedUser(null)}>
                        ← Назад к списку
                    </Typography>
                </Box>
                <Box flex={1} overflow="hidden">
                    <SupportChat targetUserId={selectedUser} />
                </Box>
            </Box>
        );
    }

    if (isLoading) return <Box p={3} display="flex" justifyContent="center"><CircularProgress /></Box>;

    return (
        <Box height="100%" bgcolor="white" borderRadius={2} overflow="auto">
            <Typography variant="h6" p={2} borderBottom="1px solid #e0e0e0">
                Запросы в поддержку
            </Typography>
            <List disablePadding>
                {summaries.length === 0 ? (
                    <Typography p={3} textAlign="center" color="text.secondary">Нет обращений</Typography>
                ) : (
                    summaries.map((chat) => (
                        <React.Fragment key={chat.userId}>
                            <ListItem button onClick={() => setSelectedUser(chat.userId)}>
                                <ListItemAvatar>
                                    <Badge badgeContent={chat.unreadCount} color="error">
                                        <Avatar><SupportAgentIcon /></Avatar>
                                    </Badge>
                                </ListItemAvatar>
                                <ListItemText 
                                    primary={chat.userName || chat.userPhone || "Пользователь"} 
                                    secondary={chat.lastMessage} 
                                    primaryTypographyProps={{ fontWeight: chat.unreadCount > 0 ? 'bold' : 'normal' }}
                                    secondaryTypographyProps={{ 
                                        noWrap: true, 
                                        fontWeight: chat.unreadCount > 0 ? 'bold' : 'normal',
                                        color: chat.unreadCount > 0 ? 'text.primary' : 'text.secondary'
                                    }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    {dayjs(chat.lastMessageAt).format("DD.MM HH:mm")}
                                </Typography>
                            </ListItem>
                            <Divider component="li" />
                        </React.Fragment>
                    ))
                )}
            </List>
        </Box>
    );
};
