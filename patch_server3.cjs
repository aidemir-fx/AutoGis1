const fs = require('fs');
const path = './AutoGis/server.ts';
let content = fs.readFileSync(path, 'utf-8');

content = content.replace(
    'const result = await pool.query(\n                "SELECT * FROM notifications WHERE target_role = $1 OR target_role = \\\'all\\\' ORDER BY created_at DESC LIMIT 50",\n                [role]\n            );',
    `let result;
            if (role === 'admin_all') {
                result = await pool.query("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100");
            } else {
                result = await pool.query(
                    "SELECT * FROM notifications WHERE target_role = $1 OR target_role = 'all' ORDER BY created_at DESC LIMIT 50",
                    [role]
                );
            }`
);

fs.writeFileSync(path, content, 'utf-8');
console.log('Patched server.ts successfully for admin view');
