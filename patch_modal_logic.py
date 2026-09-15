import re
with open('/app/applet/AutoGis/AutoGis/AutoGis/src/modules/masters/features/CreateOrderModal/useLogic/useLogic.ts', 'r') as f:
    content = f.read()

target = r"""            const providerUserId = provider\.userId \|\| provider\.id;
            await createOrder\(\{
                providerId: providerUserId,
                activityTypeId,"""
repl = """            const providerUserIds = providers.map(p => p.userId || p.id);
            await createOrder({
                providerIds: providerUserIds,
                activityTypeId,"""
content = re.sub(target, repl, content)

# we also need to change `provider` to `providers` where used
content = content.replace("props.provider", "props.providers")
content = content.replace("provider.userId", "providers[0]?.userId")
content = content.replace("provider.id", "providers[0]?.id")

# Fix the destructured provider in useLogic
content = re.sub(r"const \{ provider \} = params;", "const { providers } = params;", content)
content = re.sub(r"        provider,\n", "        providers,\n", content)

with open('/app/applet/AutoGis/AutoGis/AutoGis/src/modules/masters/features/CreateOrderModal/useLogic/useLogic.ts', 'w') as f:
    f.write(content)
