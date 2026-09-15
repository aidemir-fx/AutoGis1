import re
with open('/app/applet/AutoGis/AutoGis/AutoGis/src/screens/main-page/MainpPageScreen.tsx', 'r') as f:
    content = f.read()

target = r"""    const handleSelectAllInRadius = useCallback\(\(\) => \{
        if \(!data\) return;
        const allProviders = data\.flatMap\(cat => cat\.providers\);
        // deduplicate just in case
        const unique = Array\.from\(new Map\(allProviders\.map\(p => \[p\.id, p]\)\)\.values\(\)\);
        setSelectedProviders\(unique\);
    \}, \[data]\);"""

repl = """    const handleSelectAllInRadius = useCallback(() => {
        if (!data) return;
        // The list is actually filteredAllProviders which is derived in render. 
        // We can just grab it from data, since search bounds are already applied to `data` by the backend.
        const allProviders = data.flatMap(cat => cat.providers);
        const unique = Array.from(new Map(allProviders.map(p => [p.id, p])).values());
        setSelectedProviders(unique);
    }, [data]);"""
content = re.sub(target, repl, content)

with open('/app/applet/AutoGis/AutoGis/AutoGis/src/screens/main-page/MainpPageScreen.tsx', 'w') as f:
    f.write(content)
