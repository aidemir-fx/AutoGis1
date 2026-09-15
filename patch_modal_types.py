import re
with open('/app/applet/AutoGis/AutoGis/AutoGis/src/modules/masters/features/CreateOrderModal/types.ts', 'r') as f:
    content = f.read()

target = r"""    provider: Provider;"""
repl = """    providers: Provider[];"""
content = re.sub(target, repl, content)

with open('/app/applet/AutoGis/AutoGis/AutoGis/src/modules/masters/features/CreateOrderModal/types.ts', 'w') as f:
    f.write(content)
