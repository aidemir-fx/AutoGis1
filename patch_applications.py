import re
with open('/app/applet/AutoGis/AutoGis/AutoGis/src/screens/cabinet/Applications/Applications.tsx', 'r') as f:
    content = f.read()

# Add import for acceptOrderInvitation
content = content.replace('import { DashboardLayout } from "@modules/layout";', 'import { DashboardLayout } from "@modules/layout";\nimport { acceptOrderInvitation } from "@modules/orders/api";')

mutation_code = """
    const { mutate: handleAcceptTender, isPending: isAcceptingTender } = useMutation({
        mutationFn: acceptOrderInvitation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["provider_orders", profile?.id] });
            toast.success("Заявка успешно взята в работу!");
        },
        onError: (err: any) => {
            if (err.response?.status === 409) {
                toast.error("Эту заявку уже взял другой мастер.");
                queryClient.invalidateQueries({ queryKey: ["provider_orders", profile?.id] });
            } else {
                toast.error("Ошибка при принятии заявки.");
            }
        },
    });
"""

# Insert mutation
content = re.sub(r'(    const navigate = useNavigate\(\);)', mutation_code + r'\1', content)

# update map render to pass onAcceptTender
target_render = r"""                                <OrderAccordionItem
                                    order=\{order\}
                                    expanded=\{expandedOrderId === order.id\}
                                    highlight=\{selectedFromChat === order.id\}
                                    onToggle=\{\(\) =>
                                        setExpandedOrderId\(
                                            expandedOrderId === order\.id \? null : order\.id
                                        \)
                                    \}
                                    onChat=\{\(\) => handleChatClick\(order\.id\)\}
                                    onConfirm=\{\(\) =>
                                        openConfirmDialog\(order\.id\)
                                    \}
                                    onComplete=\{\(\) => handleComplete\(order\.id\)\}
                                    onCancel=\{\(\) => openCancelDialog\(order\.id\)\}
                                />"""
repl_render = """                                <OrderAccordionItem
                                    order={order}
                                    expanded={expandedOrderId === order.id}
                                    highlight={selectedFromChat === order.id}
                                    onToggle={() =>
                                        setExpandedOrderId(
                                            expandedOrderId === order.id ? null : order.id
                                        )
                                    }
                                    onChat={() => handleChatClick(order.id)}
                                    onConfirm={() =>
                                        openConfirmDialog(order.id)
                                    }
                                    onComplete={() => handleComplete(order.id)}
                                    onCancel={() => openCancelDialog(order.id)}
                                    onAcceptTender={() => handleAcceptTender(order.id)}
                                />"""
content = re.sub(target_render, repl_render, content)

with open('/app/applet/AutoGis/AutoGis/AutoGis/src/screens/cabinet/Applications/Applications.tsx', 'w') as f:
    f.write(content)
