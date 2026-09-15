import re
with open('/app/applet/AutoGis/AutoGis/AutoGis/src/modules/chats/api/index.ts', 'r') as f:
    content = f.read()

content = content.replace("provider: ChatUser;", "provider?: ChatUser;")

with open('/app/applet/AutoGis/AutoGis/AutoGis/src/modules/chats/api/index.ts', 'w') as f:
    f.write(content)
