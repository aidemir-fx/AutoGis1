import re
with open('/app/applet/AutoGis/AutoGis/AutoGis/src/modules/masters/features/CreateOrderModal/CreateOrderModal.tsx', 'r') as f:
    content = f.read()

content = content.replace("const { provider, open } = props;", "const { providers, open } = props;")
content = content.replace("<strong>{provider.fullName}</strong>", "<strong>{providers?.length > 1 ? `Выбрано мастеров: ${providers.length}` : providers?.[0]?.fullName}</strong>")

with open('/app/applet/AutoGis/AutoGis/AutoGis/src/modules/masters/features/CreateOrderModal/CreateOrderModal.tsx', 'w') as f:
    f.write(content)
