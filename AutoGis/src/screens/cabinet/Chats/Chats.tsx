import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Paper, useMediaQuery } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { hasCapability } from "@common/lib/userAccess";
import { goBackOrNavigate } from "@common/lib/navigation";
import { useUserProfile } from "@common/hooks";
import {
    ChatMessage,
    getCustomerOrders,
    getOrderChat,
    OrderChatResponse,
    getProviderOrders,
    saveEditedMessageText,
    sendOrderMessage,
    getUnreadCounts,
    UnreadCount,
} from "@modules/chats/api";
import {
    ChatList,
    ChatRoom,
    formatRelativeTime,
    getCompanion,
    getStatusLabel,
} from "@modules/chats/components";
import {
    ChatMessageStatusEvent,
    ChatRealtimeEvent,
    useChatTyping,
    useRealtimeChat,
} from "@modules/chats/hooks";
import { COMPACT_LAYOUT_MEDIA_QUERY } from "@modules/layout/features/layoutViewport";

type ChatTab = "ordinary" | "professional" | "archive";
type ChatView = "list" | "chat";

const ARCHIVE_ORDER_STORAGE_KEY = "autogis.chat.archiveOrderIds.v1";

export function Chats() {
    const navigate = useNavigate();
    const isMobile = useMediaQuery(COMPACT_LAYOUT_MEDIA_QUERY);
    const [searchParams, setSearchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const { profile } = useUserProfile();

    const hasExplicitTab = searchParams.has("tab");
    const requestedOrderId = searchParams.get("orderId");
    const tabParam =
        searchParams.get("tab") === "professional"
            ? "professional"
            : searchParams.get("tab") === "archive"
              ? "archive"
              : "ordinary";

    const [message, setMessage] = useState("");
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [view, setView] = useState<ChatView>("list");
    const [archiveOrderIds, setArchiveOrderIds] = useState<string[]>(() => {
        if (typeof window === "undefined") return [];
        try {
            const raw = window.localStorage.getItem(ARCHIVE_ORDER_STORAGE_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
        } catch {
            return [];
        }
    });

    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const hasProfessionalChatAccess = hasCapability(
        profile,
        "professionalChat",
    );

    const { data: customerOrders, isLoading: isCustomerOrdersLoading } = useQuery({
        queryKey: ["customerOrdersForChat", profile?.id],
        queryFn: getCustomerOrders,
        enabled: !!profile?.id,
    });

    const { data: providerOrders, isLoading: isProviderOrdersLoading } = useQuery({
        queryKey: ["providerOrdersForChat", profile?.id],
        queryFn: getProviderOrders,
        enabled: !!profile?.id && hasProfessionalChatAccess,
    });

    const { data: serverUnreadCounts } = useQuery<UnreadCount[]>({
        queryKey: ["unreadCounts"],
        queryFn: getUnreadCounts,
        enabled: !!profile?.id,
        refetchInterval: 30_000,
        staleTime: 15_000,
        retry: false,
    });

    const serverUnreadMap = useMemo(
        () => new Map<string, number>((serverUnreadCounts ?? []).map((c) => [c.orderId, c.count])),
        [serverUnreadCounts]
    );

    const customerOrderIds = useMemo(
        () => new Set((customerOrders ?? []).map((order) => order.id)),
        [customerOrders]
    );

    const providerOrderIds = useMemo(
        () => new Set((providerOrders ?? []).map((order) => order.id)),
        [providerOrders]
    );

    const unreadProviderCount = useMemo(() => {
        let total = 0;
        serverUnreadMap.forEach((count, orderId) => {
            if (providerOrderIds.has(orderId)) total += count;
        });
        return total;
    }, [providerOrderIds, serverUnreadMap]);

    const archiveOrders = useMemo(
        () =>
            [...(customerOrders ?? []), ...(providerOrders ?? [])].filter((order) =>
                archiveOrderIds.includes(order.id)
            ),
        [archiveOrderIds, customerOrders, providerOrders]
    );

    const activeOrders = useMemo(() => {
        const visibleCustomerOrders = (customerOrders ?? []).filter(
            (order) => !archiveOrderIds.includes(order.id)
        );
        const visibleProviderOrders = (providerOrders ?? []).filter(
            (order) => !archiveOrderIds.includes(order.id)
        );

        if (tabParam === "professional") return visibleProviderOrders;
        if (tabParam === "archive") return archiveOrders;
        return visibleCustomerOrders;
    }, [archiveOrderIds, archiveOrders, customerOrders, providerOrders, tabParam]);

    useEffect(() => {
        if (tabParam === "professional" && !hasProfessionalChatAccess) {
            setSearchParams({ tab: "ordinary" }, { replace: true });
        }
    }, [hasProfessionalChatAccess, setSearchParams, tabParam]);

    useEffect(() => {
        if (hasExplicitTab || !hasProfessionalChatAccess) return;
        if (unreadProviderCount > 0 && tabParam !== "professional") {
            setSearchParams({ tab: "professional" }, { replace: true });
        }
    }, [
        hasExplicitTab,
        hasProfessionalChatAccess,
        tabParam,
        unreadProviderCount,
        setSearchParams,
    ]);

    useEffect(() => {
        if (!requestedOrderId) return;

        if (
            hasProfessionalChatAccess &&
            providerOrderIds.has(requestedOrderId) &&
            tabParam !== "professional"
        ) {
            setSearchParams({ tab: "professional" }, { replace: true });
            return;
        }

        if (customerOrderIds.has(requestedOrderId) && tabParam !== "ordinary") {
            setSearchParams({ tab: "ordinary" }, { replace: true });
        }
    }, [
        customerOrderIds,
        hasProfessionalChatAccess,
        providerOrderIds,
        requestedOrderId,
        setSearchParams,
        tabParam,
    ]);

    useEffect(() => {
        try {
            window.localStorage.setItem(ARCHIVE_ORDER_STORAGE_KEY, JSON.stringify(archiveOrderIds));
        } catch {
            // ignore storage failures
        }
    }, [archiveOrderIds]);

    useEffect(() => {
        if (tabParam === "archive") {
            if (requestedOrderId) {
                const hasRequested = archiveOrders.some((order) => order.id === requestedOrderId);
                if (hasRequested) {
                    if (selectedOrderId !== requestedOrderId) {
                        setSelectedOrderId(requestedOrderId);
                    }
                    setView("chat");
                    return;
                }
            }

            if (!selectedOrderId) {
                setView("list");
                return;
            }

            const hasSelected = archiveOrders.some((order) => order.id === selectedOrderId);
            if (hasSelected) {
                setView("chat");
                return;
            }

            setSelectedOrderId(null);
            setView("list");
            return;
        }

        if (activeOrders.length === 0) {
            setSelectedOrderId(null);
            setView("list");
            return;
        }

        if (requestedOrderId) {
            const hasRequested = activeOrders.some((order) => order.id === requestedOrderId);
            if (hasRequested) {
                if (selectedOrderId !== requestedOrderId) {
                    setSelectedOrderId(requestedOrderId);
                }
                setView("chat");
            } else {
                setSelectedOrderId(null);
                setView("list");
            }
            return;
        }

        if (!selectedOrderId) {
            if (!isMobile) {
                setSelectedOrderId(activeOrders[0].id);
                setView("chat");
            }
            return;
        }

        const hasSelected = activeOrders.some((order) => order.id === selectedOrderId);
        if (!hasSelected) {
            setSelectedOrderId(isMobile ? null : activeOrders[0].id);
            setView("list");
        }
    }, [activeOrders, archiveOrders, archiveOrderIds, isMobile, requestedOrderId, selectedOrderId, tabParam]);

    useEffect(() => {
        if (!profile?.id || !serverUnreadCounts?.length) return;

        const knownOrderIds = new Set<string>([
            ...(customerOrders ?? []).map((order) => order.id),
            ...(providerOrders ?? []).map((order) => order.id),
        ]);
        const hasUnknownUnreadOrder = serverUnreadCounts.some(
            (item) => item.count > 0 && !knownOrderIds.has(item.orderId)
        );

        if (!hasUnknownUnreadOrder) return;

        queryClient.invalidateQueries({
            queryKey: ["customerOrdersForChat", profile.id],
        });
        queryClient.invalidateQueries({
            queryKey: ["providerOrdersForChat", profile.id],
        });
        queryClient.invalidateQueries({ queryKey: ["providerOrders", profile.id] });
    }, [customerOrders, profile?.id, providerOrders, queryClient, serverUnreadCounts]);

    const { data: orderChat, isLoading: isChatLoading } = useQuery({
        queryKey: ["orderChat", selectedOrderId],
        queryFn: () => getOrderChat(selectedOrderId as string),
        enabled: !!selectedOrderId,
    });

    const updateMessageStatusInCache = useCallback(
        (orderId: string, messageId: string, status: ChatMessage["status"]) => {
            queryClient.setQueryData<OrderChatResponse>(["orderChat", orderId], (current) => {
                if (!current) return current;

                return {
                    ...current,
                    messages: current.messages.map((item) =>
                        item.id === messageId ? { ...item, status } : item
                    ),
                };
            });
        },
        [queryClient]
    );

    const handleNewOrderMessage = useCallback(
        (payload: ChatRealtimeEvent) => {
            const cached = queryClient.getQueryData<OrderChatResponse>(
                ["orderChat", payload.orderId]
            );

            if (profile?.id) {
                queryClient.invalidateQueries({
                    queryKey: ["customerOrdersForChat", profile.id],
                });
                queryClient.invalidateQueries({
                    queryKey: ["providerOrdersForChat", profile.id],
                });
                queryClient.invalidateQueries({ queryKey: ["providerOrders", profile.id] });
            }

            if (cached) {
                // Чат уже в кэше — обновляем его напрямую
                queryClient.setQueryData<OrderChatResponse>(
                    ["orderChat", payload.orderId],
                    (current) => {
                        if (!current) return current;
                        const alreadyExists = current.messages.some(
                            (item) => item.id === payload.message.id
                        );
                        if (alreadyExists) return current;
                        return {
                            ...current,
                            messages: [...current.messages, payload.message],
                        };
                    }
                );
            } else {
                // Чат не открывался — инвалидируем серверный счётчик
                // чтобы badge в BottomNav обновился без ожидания polling'а
                queryClient.invalidateQueries({ queryKey: ["unreadCounts"] });
            }
        },
        [profile?.id, queryClient]
    );

    const handleMessageStatusUpdated = useCallback(
        (payload: ChatMessageStatusEvent) => {
            updateMessageStatusInCache(payload.orderId, payload.messageId, payload.status);
        },
        [updateMessageStatusInCache]
    );

    const {
        isRealtimeConnected,
        typingByOrder,
        emitTypingEvent,
        sendMessageViaSocket,
    } = useRealtimeChat({
        profileId: profile?.id,
        selectedOrderId,
        onNewOrderMessage: handleNewOrderMessage,
        onMessageStatusUpdated: handleMessageStatusUpdated,
    });

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [orderChat?.messages.length, selectedOrderId]);

    const { onInputChange: handleTypingInputChange, stopTyping } = useChatTyping({
        selectedOrderId,
        emitTypingEvent,
    });

    const handleMessageChange = (nextValue: string) => {
        setMessage(nextValue);
        handleTypingInputChange(nextValue);
    };

    const sendMessageMutation = useMutation({
        mutationFn: async ({ orderId, text }: { orderId: string; text: string }) => {
            try {
                return await sendMessageViaSocket(orderId, text);
            } catch {
                return sendOrderMessage(orderId, text);
            }
        },
        onSuccess: (newMessage: ChatMessage, variables) => {
            setMessage("");
            queryClient.setQueryData<OrderChatResponse>(
                ["orderChat", variables.orderId],
                (current) => {
                    if (!current) return current;
                    const alreadyExists = current.messages.some(
                        (item) => item.id === newMessage.id
                    );
                    if (alreadyExists) return current;

                    return {
                        ...current,
                        messages: [...current.messages, newMessage],
                    };
                }
            );
        },
    });

    const openChat = async (orderId: string) => {
        setSelectedOrderId(orderId);
        setView("chat");

        await queryClient.prefetchQuery({
            queryKey: ["orderChat", orderId],
            queryFn: () => getOrderChat(orderId),
        });

        // После загрузки чата сервер пометил сообщения как read —
        // инвалидируем серверный счётчик, чтобы badge сразу упал
        queryClient.invalidateQueries({ queryKey: ["unreadCounts"] });
    };

    const handleSend = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmed = message.trim();
        if (!trimmed || !selectedOrderId) return;

        stopTyping();
        sendMessageMutation.mutate({ orderId: selectedOrderId, text: trimmed });
    };

    const updateMessageTextInCache = useCallback(
        (orderId: string, messageId: string, nextText: string) => {
            queryClient.setQueryData<OrderChatResponse>(["orderChat", orderId], (current) => {
                if (!current) return current;
                return {
                    ...current,
                    messages: current.messages.map((item) =>
                        item.id === messageId
                            ? { ...item, message: nextText, isEdited: true, status: item.status }
                            : item
                    ),
                };
            });
        },
        [queryClient]
    );

    const handleEditMessage = useCallback(
        (messageId: string, nextText: string) => {
            if (!selectedOrderId) return;
            saveEditedMessageText(selectedOrderId, messageId, nextText);
            updateMessageTextInCache(selectedOrderId, messageId, nextText);
        },
        [selectedOrderId, updateMessageTextInCache]
    );

    const handleArchiveCurrentChat = useCallback(() => {
        if (!selectedOrderId) return;

        setArchiveOrderIds((prev) => (prev.includes(selectedOrderId) ? prev : [...prev, selectedOrderId]));
        setSelectedOrderId(null);
        setView("list");
        setSearchParams({ tab: "archive" }, { replace: true });
    }, [selectedOrderId, setSearchParams]);

    if (!profile) return null;

    const selectedOrder = activeOrders.find((item) => item.id === selectedOrderId) ?? null;
    const selectedCompanion = selectedOrder ? getCompanion(selectedOrder, profile.id) : null;

    const isChatVisible = view === "chat" && !!selectedOrderId && !!selectedCompanion;
    const isListVisible = !isChatVisible;

    const folderCounts = useMemo<Record<ChatTab, number>>(() => {
        const counts: Record<ChatTab, number> = { ordinary: 0, professional: 0, archive: 0 };

        for (const order of customerOrders ?? []) {
            if (archiveOrderIds.includes(order.id)) {
                counts.archive += serverUnreadMap.get(order.id) ?? 0;
            } else {
                counts.ordinary += serverUnreadMap.get(order.id) ?? 0;
            }
        }

        for (const order of providerOrders ?? []) {
            if (archiveOrderIds.includes(order.id)) {
                counts.archive += serverUnreadMap.get(order.id) ?? 0;
            } else {
                counts.professional += serverUnreadMap.get(order.id) ?? 0;
            }
        }

        return counts;
    }, [archiveOrderIds, customerOrders, providerOrders, serverUnreadMap]);

    const getOrderMeta = (orderId: string) => {
        const cachedChat = queryClient.getQueryData<OrderChatResponse>(["orderChat", orderId]);
        const lastMessage = cachedChat?.messages[cachedChat.messages.length - 1];

        let unreadCount: number;
        if (cachedChat) {
            unreadCount = cachedChat.messages.filter(
                (item) => item.sender.id !== profile.id && item.status !== "read"
            ).length;
        } else {
            unreadCount = serverUnreadMap.get(orderId) ?? 0;
        }

        return { lastMessage, unreadCount };
    };

    return (
        <Box
            sx={{
                minHeight: "calc(100vh - 80px)",
                display: "flex",
                justifyContent: "center",
                py: { xs: 1, md: 3 },
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    width: "100%",
                    maxWidth: 460,
                    borderRadius: 6,
                    overflow: "hidden",
                    backgroundColor: "#eff1f5",
                    border: "1px solid #e5e7eb",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: { xs: "calc(100vh - 96px)", md: "84vh" },
                }}
            >
                {isListVisible && (
                    <ChatList
                        hasProfessionalChatAccess={hasProfessionalChatAccess}
                        tab={tabParam}
                        onChangeTab={(value) => {
                            setSearchParams({ tab: value }, { replace: true });
                        }}
                        onBack={() => goBackOrNavigate(navigate, "/cabinet")}
                        orders={activeOrders}
                        isLoading={isCustomerOrdersLoading || isProviderOrdersLoading}
                        profileId={profile.id}
                        getMeta={getOrderMeta}
                        onOpenChat={(orderId) => {
                            void openChat(orderId);
                        }}
                        formatRelativeTime={formatRelativeTime}
                        folderCounts={folderCounts}
                    />
                )}

                {isChatVisible && selectedCompanion && selectedOrderId && (
                    <ChatRoom
                        companion={selectedCompanion}
                        isOnline={isRealtimeConnected}
                        onBack={() => setView("list")}
                        isLoading={isChatLoading}
                        orderChat={orderChat}
                        profileId={profile.id}
                        isTypingVisible={
                            Boolean(typingByOrder[selectedOrderId]) &&
                            typingByOrder[selectedOrderId] !== profile.id
                        }
                        messagesEndRef={messagesEndRef}
                        messageValue={message}
                        onMessageChange={handleMessageChange}
                        onMessageBlur={stopTyping}
                        onSubmit={handleSend}
                        isSending={sendMessageMutation.isPending}
                        formatRelativeTime={formatRelativeTime}
                        getStatusLabel={getStatusLabel}
                        onEditMessage={handleEditMessage}
                        onArchiveChat={handleArchiveCurrentChat}
                    />
                )}
            </Paper>
        </Box>
    );
}
