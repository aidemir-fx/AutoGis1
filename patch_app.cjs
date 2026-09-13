const fs = require('fs');
const path = './AutoGis/src/app/App.tsx';
let content = fs.readFileSync(path, 'utf-8');

if (!content.includes('NotificationListener')) {
    content = content.replace(
        'import { ToastContainer } from "react-toastify";',
        'import { ToastContainer } from "react-toastify";\nimport { NotificationListener } from "../components/NotificationListener";'
    );
    content = content.replace(
        '<ToastContainer',
        '<NotificationListener userRole="all" />\n                            <ToastContainer'
    );
}

fs.writeFileSync(path, content, 'utf-8');
console.log('Patched App.tsx successfully');
