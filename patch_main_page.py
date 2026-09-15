import re
with open('/app/applet/AutoGis/AutoGis/AutoGis/src/screens/main-page/MainpPageScreen.tsx', 'r') as f:
    content = f.read()

# Add necessary imports
imports = """import { CreateOrderModal } from "@modules/masters/features/CreateOrderModal";
"""
content = re.sub(r"import \{ ProviderShowcaseCard \}", imports + "import { ProviderShowcaseCard }", content)

# Add states inside the component
states = """
    const [tenderMode, setTenderMode] = useState(false);
    const [selectedProviders, setSelectedProviders] = useState<Provider[]>([]);
    const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);

    const toggleProviderSelection = useCallback((provider: Provider) => {
        setSelectedProviders(prev => {
            const exists = prev.find(p => p.id === provider.id);
            if (exists) return prev.filter(p => p.id !== provider.id);
            return [...prev, provider];
        });
    }, []);

    const handleSelectAllInRadius = useCallback(() => {
        if (!data) return;
        const allProviders = data.flatMap(cat => cat.providers);
        // deduplicate just in case
        const unique = Array.from(new Map(allProviders.map(p => [p.id, p])).values());
        setSelectedProviders(unique);
    }, [data]);
"""
content = re.sub(r"    const providersErrorMessage = useMemo", states + "\n    const providersErrorMessage = useMemo", content)

# Modify handleProviderClick
old_handler = r"""    const handleProviderClick = useCallback\(\(provider: Provider\) => \{
        const coordinates: \[number, number\] = \[
            provider\.coordinates\.x,
            provider\.coordinates\.y,
        \];

        hideMapAttention\(\);

        mapRef\.current\?\.scrollIntoView\(\{
            behavior: "smooth",
            block: "center",
        \}\);

        scheduleMapAttentionAfterFocus\(coordinates\);
    \}, \[hideMapAttention, scheduleMapAttentionAfterFocus\]\);"""

new_handler = """    const handleProviderClick = useCallback((provider: Provider) => {
        if (tenderMode) {
            toggleProviderSelection(provider);
            return;
        }

        const coordinates: [number, number] = [
            provider.coordinates.x,
            provider.coordinates.y,
        ];

        hideMapAttention();

        mapRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });

        scheduleMapAttentionAfterFocus(coordinates);
    }, [tenderMode, toggleProviderSelection, hideMapAttention, scheduleMapAttentionAfterFocus]);"""
content = content.replace(old_handler, new_handler)

# Add Tender Controls below TopBar
tender_controls = """
                <div style={{ padding: '16px', background: '#fff', borderBottom: '1px solid #eee', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={tenderMode} onChange={e => {
                            setTenderMode(e.target.checked);
                            if (!e.target.checked) setSelectedProviders([]);
                        }} />
                        <strong>Режим Мульти-рассылки</strong>
                    </label>
                    {tenderMode && (
                        <>
                            <Button size="small" variant="outlined" onClick={handleSelectAllInRadius}>
                                Выбрать всех в радиусе ({data ? Array.from(new Map(data.flatMap(c => c.providers).map(p => [p.id, p])).values()).length : 0})
                            </Button>
                            <Button size="small" variant="primary" disabled={selectedProviders.length === 0} onClick={() => setIsCreateOrderOpen(true)}>
                                Отправить заявку ({selectedProviders.length})
                            </Button>
                        </>
                    )}
                </div>
"""
content = re.sub(r"(</TopBar>)", r"\1" + tender_controls, content)

# Add selected styling to ProviderShowcaseCard (we'll just pass a prop or wrap it)
content = content.replace("<ProviderShowcaseCard", "<div style={tenderMode && selectedProviders.find(p => p.id === provider.id) ? { outline: '2px solid #007bff', borderRadius: '16px', overflow: 'hidden' } : {}} onClick={tenderMode ? (e) => { e.preventDefault(); e.stopPropagation(); toggleProviderSelection(provider); } : undefined}><ProviderShowcaseCard")
content = content.replace("/>\n                                                    ))", "/></div>\n                                                    ))")

# Add the modal
modal_code = """
            {isCreateOrderOpen && selectedProviders.length > 0 && (
                <CreateOrderModal
                    open={isCreateOrderOpen}
                    onClose={() => setIsCreateOrderOpen(false)}
                    providers={selectedProviders}
                />
            )}
        </PageRoot>
"""
content = re.sub(r"        </PageRoot>", modal_code, content)

with open('/app/applet/AutoGis/AutoGis/AutoGis/src/screens/main-page/MainpPageScreen.tsx', 'w') as f:
    f.write(content)
