const fs = require('fs');
const path = './AutoGis/server.ts';
let content = fs.readFileSync(path, 'utf-8');

const newRoutes = `
    app.delete("/api/notifications/:id", async (req: Request, res: Response) => {
        try {
            await pool.query("DELETE FROM notifications WHERE id = $1", [req.params.id]);
            res.json({ success: true });
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: "DB Error" });
        }
    });

    app.delete("/api/notifications", async (req: Request, res: Response) => {
        try {
            await pool.query("DELETE FROM notifications");
            res.json({ success: true });
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: "DB Error" });
        }
    });
`;

if (!content.includes('app.delete("/api/notifications"')) {
    content = content.replace(
        'app.post("/api/notifications"',
        newRoutes + '\n    app.post("/api/notifications"'
    );
    fs.writeFileSync(path, content, 'utf-8');
    console.log('Patched server.ts successfully');
} else {
    console.log('Already patched');
}
