import re
with open('/app/applet/AutoGis/AutoGis/AutoGis/src/modules/masters/features/CreateOrderModal/useLogic/useLogic.ts', 'r') as f:
    content = f.read()

content = content.replace("providers[0]?.userId", "providers?.[0]?.userId")
content = content.replace("providers[0]?.id", "providers?.[0]?.id")

with open('/app/applet/AutoGis/AutoGis/AutoGis/src/modules/masters/features/CreateOrderModal/useLogic/useLogic.ts', 'w') as f:
    f.write(content)
