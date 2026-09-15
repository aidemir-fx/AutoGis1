const fs = require('fs');
const path = './AutoGis/backend/internal/realtime/hub.go';
let content = fs.readFileSync(path, 'utf-8');

if (!content.includes('EmitSupportMessage')) {
    const newMethod = `
func (h *Hub) EmitSupportMessage(userIDs []string, message interface{}) {
	h.emitToUsers(userIDs, "new_support_message", message)
}
`;
    content += newMethod;
    fs.writeFileSync(path, content, 'utf-8');
    console.log('Patched hub.go successfully');
}
