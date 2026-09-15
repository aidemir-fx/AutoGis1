import re
with open('/app/applet/AutoGis/AutoGis/AutoGis/src/modules/masters/features/MasterAccountHeader/MasterAccountHeader.tsx', 'r') as f:
    content = f.read()

content = content.replace("provider={master}", "providers={[master]}")

with open('/app/applet/AutoGis/AutoGis/AutoGis/src/modules/masters/features/MasterAccountHeader/MasterAccountHeader.tsx', 'w') as f:
    f.write(content)
