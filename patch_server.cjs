const fs = require('fs');
const path = './AutoGis/server.ts';
let content = fs.readFileSync(path, 'utf-8');

// 1. Add pg import at the top
if (!content.includes('import { Pool } from "pg";')) {
    content = content.replace('import express, { Request, Response } from "express";', 'import express, { Request, Response } from "express";\nimport { Pool } from "pg";');
}

// 2. Add db initialization and routes inside startServer()
const dbInitCode = `
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/autogis"
    });

    try {
        await pool.query(\`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                message TEXT NOT NULL,
                target_role VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        \`);
        console.log("Notifications table ready");
    } catch (e) {
        console.error("DB init error:", e);
    }

    app.get("/api/notifications", async (req: Request, res: Response) => {
        try {
            const role = req.query.role as string || 'all';
            const result = await pool.query(
                "SELECT * FROM notifications WHERE target_role = $1 OR target_role = 'all' ORDER BY created_at DESC LIMIT 50",
                [role]
            );
            res.json(result.rows);
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: "DB Error" });
        }
    });

    app.post("/api/notifications", async (req: Request, res: Response) => {
        try {
            const { message, targetRole } = req.body;
            if (!message || !targetRole) return res.status(400).json({error: "Missing fields"});
            const result = await pool.query(
                "INSERT INTO notifications (message, target_role) VALUES ($1, $2) RETURNING *",
                [message, targetRole]
            );
            res.json(result.rows[0]);
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: "DB Error" });
        }
    });
`;

if (!content.includes('pool.query(')) {
    content = content.replace('const PORT = 3000;', 'const PORT = 3000;\n' + dbInitCode);
}

fs.writeFileSync(path, content, 'utf-8');
console.log('Patched server.ts successfully');
