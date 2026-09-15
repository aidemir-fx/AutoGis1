import re
with open('/app/applet/AutoGis/AutoGis/AutoGis/src/screens/main-page/MainpPageScreen.tsx', 'r') as f:
    content = f.read()

target = r"""                                                />
                                            \}\)\}"""
repl = """                                                /></div>
                                            ))}"""
content = re.sub(target, repl, content)

with open('/app/applet/AutoGis/AutoGis/AutoGis/src/screens/main-page/MainpPageScreen.tsx', 'w') as f:
    f.write(content)
