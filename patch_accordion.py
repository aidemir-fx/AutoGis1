import re
with open('/app/applet/AutoGis/AutoGis/AutoGis/src/screens/cabinet/Applications/components/OrderAccordionItem.tsx', 'r') as f:
    content = f.read()

target_props = r"""type OrderAccordionItemProps = \{
    order: ChatOrder;
    expanded: boolean;
    highlight\?: boolean;
    onToggle: \(\) => void;
    onChat: \(\) => void;
    onConfirm: \(\) => void;
    onComplete: \(\) => void;
    onCancel: \(\) => void;
\}"""

repl_props = """type OrderAccordionItemProps = {
    order: ChatOrder;
    expanded: boolean;
    highlight?: boolean;
    onToggle: () => void;
    onChat: () => void;
    onConfirm: () => void;
    onComplete: () => void;
    onCancel: () => void;
    onAcceptTender?: () => void;
}"""
content = re.sub(target_props, repl_props, content)

target_destruct = r"""    onConfirm,
    onComplete,
    onCancel,
\} = props;"""
repl_destruct = """    onConfirm,
    onComplete,
    onCancel,
    onAcceptTender,
} = props;"""
content = re.sub(target_destruct, repl_destruct, content)

# Add Accept button
target_buttons = r"""                    {isPending && \(
                        <>
                            <ActionBtn
                                icon=\{<Check size=\{14\} strokeWidth=\{2.5\} />\}
                                label="Принять"
                                variant="primary"
                                onClick=\{onConfirm\}
                            />
                            <ActionBtn
                                icon=\{<X size=\{14\} strokeWidth=\{2.5\} />\}
                                label="Отказать"
                                variant="danger"
                                onClick=\{onCancel\}
                            />
                        </>
                    \)}"""
repl_buttons = """                    {isPending && !order.provider && (
                        <ActionBtn
                            icon={<Check size={14} strokeWidth={2.5} />}
                            label="Взять в работу"
                            variant="primary"
                            onClick={onAcceptTender}
                        />
                    )}
                    {isPending && order.provider && (
                        <>
                            <ActionBtn
                                icon={<Check size={14} strokeWidth={2.5} />}
                                label="Принять время"
                                variant="primary"
                                onClick={onConfirm}
                            />
                            <ActionBtn
                                icon={<X size={14} strokeWidth={2.5} />}
                                label="Отказать"
                                variant="danger"
                                onClick={onCancel}
                            />
                        </>
                    )}"""
content = re.sub(target_buttons, repl_buttons, content)

with open('/app/applet/AutoGis/AutoGis/AutoGis/src/screens/cabinet/Applications/components/OrderAccordionItem.tsx', 'w') as f:
    f.write(content)
