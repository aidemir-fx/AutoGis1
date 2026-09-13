import React, { useState } from 'react';
import { Box, Button, TextField, Select, MenuItem, FormControl, InputLabel, Typography } from '@mui/material';
import { toast } from 'react-toastify';

export const AdminNotificationForm: React.FC = () => {
    const [message, setMessage] = useState('');
    const [targetRole, setTargetRole] = useState('all');

    const handleSend = async () => {
        if (!message) return;
        try {
            const res = await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, targetRole })
            });
            if (res.ok) {
                toast.success('Уведомление успешно отправлено');
                setMessage('');
            } else {
                toast.error('Ошибка при отправке');
            }
        } catch (e) {
            toast.error('Ошибка сервера');
        }
    };

    return (
        <Box sx={{ p: 3, border: '1px solid #ccc', borderRadius: 2, mb: 3, backgroundColor: '#fff' }}>
            <Typography variant="h6" gutterBottom>Отправить системное уведомление</Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Получатели</InputLabel>
                <Select value={targetRole} onChange={(e) => setTargetRole(e.target.value as string)} label="Получатели">
                    <MenuItem value="all">Всем пользователям</MenuItem>
                    <MenuItem value="master">Мастерам</MenuItem>
                    <MenuItem value="business">Бизнесу</MenuItem>
                    <MenuItem value="driver">Водителям</MenuItem>
                </Select>
            </FormControl>
            <TextField 
                fullWidth 
                multiline 
                rows={3} 
                variant="outlined" 
                label="Текст уведомления" 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                sx={{ mb: 2 }}
            />
            <Button variant="contained" color="primary" onClick={handleSend} disabled={!message}>
                Отправить
            </Button>
        </Box>
    );
};
