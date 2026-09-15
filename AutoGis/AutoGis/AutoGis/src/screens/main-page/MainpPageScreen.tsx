import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";

import { Filters, GeolocationPrompt, MasterStatus } from "@modules/masters";
import {
    ActivityType,
    DEFAULT_SEARCH_RADIUS,
    Provider,
    ProvidersMap,
} from "@modules/providers";
import { AppActivityTypes } from "@modules/providers/features/ActivityTypeFilters/constants";
import { fetchCombinedProviders } from "@modules/providers/api";
import { CreateOrderModal } from "@modules/masters/features/CreateOrderModal";
import { ProviderShowcaseCard } from "@modules/providers/features/ProviderShowcaseCard";
import { Button, ErrorState } from "@common/components";
import { LogoIcon } from "@common/icons";
import { useAuth, useCoords, useQueryParams, useUserProfile } from "@common/hooks";
import { NotificationBell } from "../../components/NotificationBell";
import {
    ActivityChip,
    AvailableGrid,
    AvailableSection,
    BrandLogo,
    BrandMark,
    CarouselHead,
    CarouselMeta,
    CarouselSection,
    CarouselTitle,
    CarouselTrack,
    ContentFlow,
    CounterDot,
    CounterLine,
    EmptyCard,
    ErrorWrapper,
    FiltersStrip,
    HeroCopy,
    HeroGrid,
    HeroMapCard,
    HomeShell,
    LoadingPanel,
    MapAttentionMarker,
    MapWrapper,
    PageRoot,
    ProfileButton,
    SearchPanel,
    TopActions,
    TopBar,
} from "./styles";

type ProviderCategory = {
    type: ActivityType;
    title: string;
    chip: string;
    empty: string;
};

const PROVIDER_CATEGORIES: ProviderCategory[] = [
    {
        type: ActivityType.master,
        title: "Частные мастера",
        chip: "Частные",
        empty: "Пока нет частных мастеров в выбранном радиусе.",
    },
    {
        type: ActivityType.auto_service,
        title: "Автосервисы",
        chip: "Автосервисы",
        empty: "Автосервисы не найдены. Попробуйте увеличить радиус.",
    },
    {
        type: ActivityType.auto_wash,
        title: "Автомойки",
        chip: "Автомойки",
        empty: "Автомоек рядом пока не найдено.",
    },
    {
        type: ActivityType.auto_shop,
        title: "Автомагазины",
        chip: "Магазины",
        empty: "Автомагазинов рядом пока не найдено.",
    },
];

const DEFAULT_CENTER: [number, number] = [43.21564479600424, 46.89458462676669];
const MAP_FOCUS_ZOOM = 17;
const MAP_FOCUS_DURATION = 650;
const MAP_SCROLL_FOCUS_MAX_WAIT = 1800;
const MAP_SCROLL_STABLE_FRAMES = 6;
const MAP_ATTENTION_AFTER_FOCUS_DELAY = 120;
const MAP_ATTENTION_VISIBLE_DURATION = 1280;

function isElementFocusedInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();

    if (rect.height <= 0 || rect.width <= 0) {
        return false;
    }

    const elementCenter = rect.top + rect.height / 2;
    const hasVisibleCenter =
        elementCenter >= 0 && elementCenter <= window.innerHeight;
    const isMostlyOnscreen =
        rect.top <= window.innerHeight * 0.72 &&
        rect.bottom >= window.innerHeight * 0.28;

    return hasVisibleCenter || isMostlyOnscreen;
}

function normalizeActivityTypes(value: unknown): ActivityType[] {
    if (!value) {
        return [];
    }

    const rawValue = Array.isArray(value) ? value.join(",") : String(value);
    return rawValue
        .split(",")
        .filter((type): type is ActivityType =>
            Object.values(ActivityType).includes(type as ActivityType)
        )
        .sort();
}

function getProviderText(provider: Provider): string {
    return [
        provider.fullName,
        provider.name,
        provider.businessName,
        provider.address,
        provider.description,
        ...(provider.professions || []),
        ...(provider.services || []),
        ...(provider.autoMarks || []),
        ...(provider.brandSupport || []),
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
}

function filterByQuery(providers: Provider[], query: string[]): Provider[] {
    const terms = query.map((item) => item.trim().toLowerCase()).filter(Boolean);

    if (terms.length === 0) {
        return providers;
    }

    return providers.filter((provider) => {
        const haystack = getProviderText(provider);
        return terms.every((term) => haystack.includes(term));
    });
}

function countAvailable(providers: Provider[]): number {
    return providers.reduce((count, provider) => {
        const visibleStatus = provider.currentStatus || provider.status;
        return visibleStatus === MasterStatus.AVAILABLE ? count + 1 : count;
    }, 0);
}

function getInitials(name?: string | null): string {
    if (!name) {
        return "AG";
    }

    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
}


interface SelectableProviderCardProps {
    key?: string;
    provider: Provider;
    tenderMode: boolean;
    isSelected: boolean;
    onToggle: (provider: Provider) => void;
    onShowOnMap: (provider: Provider) => void;
    isCarouselItem?: boolean;
}

const SelectableProviderCard = ({
    provider,
    tenderMode,
    isSelected,
    onToggle,
    onShowOnMap,
    isCarouselItem = false,
}: SelectableProviderCardProps) => {
    return (
        <div
            style={{
                position: 'relative',
                borderRadius: '16px',
                flexShrink: isCarouselItem ? 0 : undefined,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isSelected
                    ? '0 0 0 3px #2563eb, 0 12px 28px -4px rgba(37, 99, 235, 0.3)'
                    : tenderMode
                        ? '0 2px 10px rgba(0, 0, 0, 0.08)'
                        : 'none',
                transform: isSelected ? 'scale(1.015)' : 'none',
                userSelect: 'none',
            }}
        >
            {tenderMode && (
                <>
                    {/* Visual indicator badge in the top right corner */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            zIndex: 10,
                            pointerEvents: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: isSelected ? '5px 12px 5px 8px' : '5px 10px 5px 8px',
                            background: isSelected ? '#2563eb' : 'rgba(255, 255, 255, 0.96)',
                            color: isSelected ? '#ffffff' : '#1d4ed8',
                            border: isSelected ? '2px solid #1d4ed8' : '2px solid #3b82f6',
                            borderRadius: '20px',
                            boxShadow: isSelected
                                ? '0 4px 14px rgba(37, 99, 235, 0.45)'
                                : '0 2px 8px rgba(0, 0, 0, 0.15)',
                            fontWeight: 700,
                            fontSize: '12px',
                            backdropFilter: 'blur(4px)',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        <div
                            style={{
                                width: 18,
                                height: 18,
                                borderRadius: '50%',
                                background: isSelected ? '#ffffff' : '#eff6ff',
                                color: '#2563eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: isSelected ? '12px' : '15px',
                                fontWeight: 800,
                                lineHeight: 1,
                            }}
                        >
                            {isSelected ? '✓' : '+'}
                        </div>
                        <span>{isSelected ? 'Выбран' : 'Выбрать'}</span>
                    </div>

                    {/* Click interceptor across the entire card */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            zIndex: 8,
                            cursor: 'pointer',
                            borderRadius: '16px',
                            background: isSelected
                                ? 'rgba(37, 99, 235, 0.04)'
                                : 'transparent',
                        }}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onToggle(provider);
                        }}
                        title={
                            isSelected
                                ? 'Нажмите, чтобы убрать из рассылки'
                                : 'Нажмите, чтобы добавить в рассылку'
                        }
                    />
                </>
            )}

            <ProviderShowcaseCard
                provider={provider}
                onShowOnMap={onShowOnMap}
            />
        </div>
    );
};

export const MainpPageScreen = () => {

    const [query, setQuery] = useState<string[]>([]);
    const [isMapAttentionVisible, setIsMapAttentionVisible] = useState(false);
    const [mapAttentionKey, setMapAttentionKey] = useState(0);
    const mastersRef = useRef<Record<string, any>>({});
    const mapRef = useRef<HTMLDivElement>(null);
    const yandexMapRef = useRef<any>(null);
    const mapAttentionTimeoutRef = useRef<number | null>(null);
    const mapFocusFrameRef = useRef<number | null>(null);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { profile } = useUserProfile({ enabled: isAuthenticated });
    const { userCoords } = useCoords();
    const { params, setParam } = useQueryParams();

    const [lat, lng] = userCoords ?? DEFAULT_CENTER;
    const radius = params.radius
        ? parseFloat(params.radius as string)
        : DEFAULT_SEARCH_RADIUS;

    const selectedActivityTypes = useMemo(
        () => normalizeActivityTypes(params.activityTypes),
        [params.activityTypes]
    );

    const activeTypes = useMemo(
        () =>
            selectedActivityTypes.length > 0
                ? selectedActivityTypes
                : (AppActivityTypes as ActivityType[]),
        [selectedActivityTypes]
    );

    const isAllTypesActive = selectedActivityTypes.length === 0;

    const { data, isLoading, error, isError, refetch } = useQuery({
        queryKey: [
            "combined-providers",
            lat,
            lng,
            radius,
        ],
        queryFn: () => fetchCombinedProviders(lat, lng, radius),
        enabled: true,
        retry: false,
        refetchOnWindowFocus: false,
    });

    const nearbyAfterSearch = useMemo(
        () => filterByQuery(data?.nearbyProviders ?? [], query),
        [data?.nearbyProviders, query]
    );

    const allAfterSearch = useMemo(
        () => filterByQuery(data?.allProviders ?? [], query),
        [data?.allProviders, query]
    );

    const filteredNearbyProviders = useMemo(
        () =>
            nearbyAfterSearch.filter((provider) =>
                activeTypes.includes(provider.activityType || ActivityType.master)
            ),
        [activeTypes, nearbyAfterSearch]
    );

    const filteredAllProviders = useMemo(
        () =>
            allAfterSearch.filter((provider) =>
                activeTypes.includes(provider.activityType || ActivityType.master)
            ),
        [activeTypes, allAfterSearch]
    );

    const providersByType = useMemo(() => {
        return PROVIDER_CATEGORIES.reduce(
            (acc, category) => {
                acc[category.type] = filteredNearbyProviders.filter(
                    (provider) =>
                        (provider.activityType || ActivityType.master) ===
                        category.type
                );
                return acc;
            },
            {} as Record<ActivityType, Provider[]>
        );
    }, [filteredNearbyProviders]);

    const countsByType = useMemo(() => {
        return PROVIDER_CATEGORIES.reduce(
            (acc, category) => {
                acc[category.type] = nearbyAfterSearch.filter(
                    (provider) =>
                        (provider.activityType || ActivityType.master) ===
                        category.type
                ).length;
                return acc;
            },
            {} as Record<ActivityType, number>
        );
    }, [nearbyAfterSearch]);

    const categoriesToRender = useMemo(
        () =>
            PROVIDER_CATEGORIES.filter((category) =>
                activeTypes.includes(category.type)
            ),
        [activeTypes]
    );

    const availableProviders = useMemo(
        () =>
            filteredNearbyProviders.filter(
                (provider) =>
                    (provider.currentStatus || provider.status) ===
                    MasterStatus.AVAILABLE
            ),
        [filteredNearbyProviders]
    );

    const availableCount = availableProviders.length;

    const clearMapAttentionTimers = useCallback(() => {
        if (mapAttentionTimeoutRef.current !== null) {
            window.clearTimeout(mapAttentionTimeoutRef.current);
            mapAttentionTimeoutRef.current = null;
        }

        if (mapFocusFrameRef.current !== null) {
            window.cancelAnimationFrame(mapFocusFrameRef.current);
            mapFocusFrameRef.current = null;
        }
    }, []);

    const hideMapAttention = useCallback(() => {
        clearMapAttentionTimers();
        setIsMapAttentionVisible(false);
    }, [clearMapAttentionTimers]);

    const showMapAttention = useCallback(() => {
        if (mapAttentionTimeoutRef.current !== null) {
            window.clearTimeout(mapAttentionTimeoutRef.current);
        }

        setMapAttentionKey((key) => key + 1);
        setIsMapAttentionVisible(true);
        mapAttentionTimeoutRef.current = window.setTimeout(() => {
            setIsMapAttentionVisible(false);
            mapAttentionTimeoutRef.current = null;
        }, MAP_ATTENTION_VISIBLE_DURATION);
    }, []);

    const focusMapOnCoordinates = useCallback((coordinates: [number, number]) => {
        try {
            yandexMapRef.current?.container?.fitToViewport?.();
            yandexMapRef.current?.setCenter(coordinates, MAP_FOCUS_ZOOM, {
                duration: MAP_FOCUS_DURATION,
                checkZoomRange: true,
            });
        } catch (_) {
            try {
                yandexMapRef.current?.setCenter(coordinates, MAP_FOCUS_ZOOM);
            } catch (_) {}
        }
    }, []);

    const scheduleMapAttentionAfterFocus = useCallback(
        (coordinates: [number, number]) => {
            const mapElement = mapRef.current;

            if (!mapElement) {
                focusMapOnCoordinates(coordinates);
                mapAttentionTimeoutRef.current = window.setTimeout(() => {
                    showMapAttention();
                }, MAP_FOCUS_DURATION + MAP_ATTENTION_AFTER_FOCUS_DELAY);
                return;
            }

            const startedAt = window.performance.now();
            let lastScrollY = window.scrollY;
            let stableFrames = 0;

            const waitForMapFocus = () => {
                const now = window.performance.now();
                const currentScrollY = window.scrollY;
                const scrollDelta = Math.abs(currentScrollY - lastScrollY);

                stableFrames =
                    scrollDelta < 1 ? stableFrames + 1 : 0;
                lastScrollY = currentScrollY;

                const elapsed = now - startedAt;
                const isMapFocused = isElementFocusedInViewport(mapElement);
                const isScrollSettled =
                    stableFrames >= MAP_SCROLL_STABLE_FRAMES;
                const isMapMoveSettled = elapsed >= MAP_FOCUS_DURATION;
                const timedOut = elapsed >= MAP_SCROLL_FOCUS_MAX_WAIT;

                if (
                    (isMapFocused && isScrollSettled && isMapMoveSettled) ||
                    timedOut
                ) {
                    mapFocusFrameRef.current = null;
                    focusMapOnCoordinates(coordinates);
                    mapAttentionTimeoutRef.current = window.setTimeout(() => {
                        showMapAttention();
                    }, MAP_FOCUS_DURATION + MAP_ATTENTION_AFTER_FOCUS_DELAY);
                    return;
                }

                mapFocusFrameRef.current =
                    window.requestAnimationFrame(waitForMapFocus);
            };

            mapFocusFrameRef.current = window.requestAnimationFrame(waitForMapFocus);
        },
        [focusMapOnCoordinates, showMapAttention]
    );

    useEffect(() => {
        return () => {
            clearMapAttentionTimers();
        };
    }, [clearMapAttentionTimers]);

    const handleProviderClick = useCallback((provider: Provider) => {
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
    }, [hideMapAttention, scheduleMapAttentionAfterFocus]);

    const handleAllTypesClick = useCallback(() => {
        setParam("activityTypes", null);
    }, [setParam]);

    const handleActivityTypeClick = useCallback(
        (type: ActivityType) => {
            if (isAllTypesActive) {
                setParam("activityTypes", type);
                return;
            }

            const next = activeTypes.includes(type)
                ? activeTypes.filter((item) => item !== type)
                : [...activeTypes, type];

            setParam(
                "activityTypes",
                next.length === 0 || next.length === AppActivityTypes.length
                    ? null
                    : next.join(",")
            );
        },
        [activeTypes, isAllTypesActive, setParam]
    );


    const [tenderMode, setTenderMode] = useState(false);
    const [selectedProviders, setSelectedProviders] = useState<Provider[]>([]);
    const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);

    const toggleProviderSelection = useCallback((provider: Provider) => {
        const targetId = provider.userId || provider.id;
        setSelectedProviders(prev => {
            const exists = prev.some(p => (p.userId || p.id) === targetId);
            if (exists) return prev.filter(p => (p.userId || p.id) !== targetId);
            return [...prev, provider];
        });
    }, []);

    const handleDeselectAll = useCallback(() => {
        setSelectedProviders([]);
    }, []);

    const handleSelectAllInRadius = useCallback(() => {
        setSelectedProviders(filteredNearbyProviders || []);
    }, [filteredNearbyProviders]);

    const providersErrorMessage = useMemo(() => {
        if (!error) {
            return "Не удалось загрузить список специалистов.";
        }

        if (isAxiosError(error) && error.code === "ERR_NETWORK") {
            return "Не удалось подключиться к серверу. Проверьте, что backend запущен и доступен на порту 3001.";
        }

        return "Не удалось загрузить список специалистов. Попробуйте обновить страницу.";
    }, [error]);

    return (
        <PageRoot>
            <HomeShell>
                <TopBar>
                    <BrandMark href="/" aria-label="Автогис">
                        <BrandLogo src={LogoIcon} alt="Автогис" />
                    </BrandMark>
                    <TopActions>
                        {isAuthenticated && profile && (
                            <NotificationBell
                                isAdmin={
                                    profile.role === "ADMIN" ||
                                    profile.role === "admin"
                                }
                            />
                        )}
                        <ProfileButton
                            aria-label={
                                isAuthenticated ? "Профиль" : "Войти в профиль"
                            }
                            onClick={() =>
                                navigate(isAuthenticated ? "/cabinet" : "/login")
                            }
                        >
                            {isAuthenticated
                                ? getInitials(profile?.name)
                                : "Войти"}
                        </ProfileButton>
                    </TopActions>
                </TopBar>
                <div
                    style={{
                        margin: '12px 0 20px',
                        padding: '16px 20px',
                        background: '#ffffff',
                        borderRadius: '16px',
                        border: tenderMode ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                        boxShadow: tenderMode
                            ? '0 8px 24px rgba(37, 99, 235, 0.1)'
                            : '0 1px 3px rgba(0, 0, 0, 0.04)',
                        transition: 'all 0.2s ease',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '12px',
                        }}
                    >
                        <label
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                cursor: 'pointer',
                                userSelect: 'none',
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={tenderMode}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    setTenderMode(checked);
                                    if (!checked) setSelectedProviders([]);
                                }}
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    cursor: 'pointer',
                                    accentColor: '#2563eb',
                                }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <strong style={{ fontSize: '16px', color: '#111827' }}>
                                    Режим Мульти-рассылки
                                </strong>
                                {tenderMode && (
                                    <span
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            padding: '3px 8px',
                                            borderRadius: '12px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            background: '#dbeafe',
                                            color: '#1d4ed8',
                                            letterSpacing: '0.02em',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: '6px',
                                                height: '6px',
                                                borderRadius: '50%',
                                                background: '#2563eb',
                                            }}
                                        />
                                        Активен
                                    </span>
                                )}
                            </div>
                        </label>

                        {tenderMode && (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    flexWrap: 'wrap',
                                }}
                            >
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={handleSelectAllInRadius}
                                >
                                    Выбрать всех в радиусе ({filteredNearbyProviders?.length ?? 0})
                                </Button>
                                {selectedProviders.length > 0 && (
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={handleDeselectAll}
                                    >
                                        Сбросить
                                    </Button>
                                )}
                                <Button
                                    size="small"
                                    variant="contained"
                                    disabled={selectedProviders.length === 0}
                                    onClick={() => setIsCreateOrderOpen(true)}
                                >
                                    Отправить заявку ({selectedProviders.length})
                                </Button>
                            </div>
                        )}
                    </div>

                    {tenderMode && (
                        <div
                            style={{
                                marginTop: '14px',
                                padding: '12px 16px',
                                background: '#eff6ff',
                                borderRadius: '12px',
                                border: '1px solid #bfdbfe',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '12px',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '22px',
                                    lineHeight: 1,
                                    flexShrink: 0,
                                    marginTop: '2px',
                                }}
                            >
                                💡
                            </div>
                            <div style={{ fontSize: '13px', lineHeight: 1.55, color: '#1e3a8a' }}>
                                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
                                    Как работает мульти-рассылка:
                                </div>
                                <div>
                                    • <strong>Кликайте по карточкам мастеров</strong> в каруселях и списках ниже — на выбранных карточках появится синяя отметка <strong>«✓ Выбран»</strong>.<br />
                                    • Либо нажмите кнопку <strong>«Выбрать всех в радиусе»</strong>, чтобы сразу отметить всех доступных специалистов.<br />
                                    • Нажмите <strong>«Отправить заявку»</strong> — ваша заявка уйдет сразу всем отмеченным мастерам, и вы сможете выбрать лучший ответ!
                                </div>
                                <div
                                    style={{
                                        marginTop: '8px',
                                        fontWeight: 600,
                                        color: selectedProviders.length > 0 ? '#15803d' : '#4b5563',
                                    }}
                                >
                                    {selectedProviders.length > 0
                                        ? `✓ Выбрано специалистов: ${selectedProviders.length}. Нажмите «Отправить заявку» или продолжайте выбор.`
                                        : '👉 Пока не выбрано ни одного мастера. Кликните по любой карточке ниже, чтобы выбрать.'}
                                </div>
                            </div>
                        </div>
                    )}
                </div>


                {isError && !data ? (
                    <ErrorWrapper>
                        <ErrorState
                            message={providersErrorMessage}
                            onRetry={() => {
                                void refetch();
                            }}
                        />
                    </ErrorWrapper>
                ) : (
                    <>
                        <HeroGrid>
                            <HeroCopy>
                                <SearchPanel>
                                    <Filters
                                        query={query}
                                        onChange={(next) =>
                                            setQuery(next.query)
                                        }
                                    />
                                </SearchPanel>
                            </HeroCopy>

                            <HeroMapCard ref={mapRef}>
                                <MapWrapper>
                                    <ProvidersMap
                                        masters={filteredAllProviders}
                                        mastersRef={mastersRef}
                                        mapInstanceRef={yandexMapRef}
                                        isLoading={isLoading}
                                        height="418px"
                                    />
                                    {isMapAttentionVisible && (
                                        <MapAttentionMarker
                                            key={mapAttentionKey}
                                            aria-hidden="true"
                                        />
                                    )}
                                </MapWrapper>
                            </HeroMapCard>
                        </HeroGrid>

                        <FiltersStrip>
                            <ActivityChip
                                $isActive={isAllTypesActive}
                                onClick={handleAllTypesClick}
                            >
                                Все
                                <span>{nearbyAfterSearch.length}</span>
                            </ActivityChip>
                            {PROVIDER_CATEGORIES.map((category) => (
                                <ActivityChip
                                    key={category.type}
                                    $isActive={
                                        !isAllTypesActive &&
                                        activeTypes.includes(category.type)
                                    }
                                    onClick={() =>
                                        handleActivityTypeClick(category.type)
                                    }
                                >
                                    {category.chip}
                                    <span>{countsByType[category.type] || 0}</span>
                                </ActivityChip>
                            ))}
                        </FiltersStrip>

                        <CounterLine>
                            <span>
                                <b>{filteredNearbyProviders.length}</b> рядом
                            </span>
                            <CounterDot />
                            <span className="ok">
                                <b>{availableCount}</b> доступны сейчас
                            </span>
                            <CounterDot />
                            <span>{radius} км</span>
                        </CounterLine>

                        {isLoading ? (
                            <LoadingPanel>Загрузка предложений...</LoadingPanel>
                        ) : (
                            <ContentFlow>
                                {categoriesToRender.map((category) => {
                                    const providers =
                                        providersByType[category.type] || [];
                                    const categoryAvailable =
                                        countAvailable(providers);

                                    return (
                                        <CarouselSection key={category.type}>
                                            <CarouselHead>
                                                <CarouselTitle>
                                                    {category.title}
                                                </CarouselTitle>
                                                <CarouselMeta>
                                                    {providers.length} рядом ·{" "}
                                                    {categoryAvailable} доступно
                                                </CarouselMeta>
                                            </CarouselHead>
                                            <CarouselTrack>
                                                {providers.length > 0 ? (
                                                    providers.map((provider) => {
                                                        const targetId = provider.userId || provider.id;
                                                        const isSelected = tenderMode && selectedProviders.some(p => (p.userId || p.id) === targetId);
                                                        return (
                                                            <SelectableProviderCard
                                                                key={`${provider.activityType}-${provider.id}`}
                                                                provider={provider}
                                                                tenderMode={tenderMode}
                                                                isSelected={isSelected}
                                                                onToggle={toggleProviderSelection}
                                                                onShowOnMap={handleProviderClick}
                                                                isCarouselItem
                                                            />
                                                        );
                                                    })
                                                ) : (
                                                    <EmptyCard>
                                                        {category.empty}
                                                    </EmptyCard>
                                                )}
                                            </CarouselTrack>
                                        </CarouselSection>
                                    );
                                })}

                                <AvailableSection>
                                    <CarouselHead>
                                        <CarouselTitle>
                                            Доступные сейчас
                                        </CarouselTitle>
                                        <CarouselMeta>
                                            {availableProviders.length} вариантов
                                        </CarouselMeta>
                                    </CarouselHead>
                                    {availableProviders.length > 0 ? (
                                        <AvailableGrid>
                                            {availableProviders.map((provider) => {
                                                const targetId = provider.userId || provider.id;
                                                const isSelected = tenderMode && selectedProviders.some(p => (p.userId || p.id) === targetId);
                                                return (
                                                    <SelectableProviderCard
                                                        key={`available-${provider.activityType}-${provider.id}`}
                                                        provider={provider}
                                                        tenderMode={tenderMode}
                                                        isSelected={isSelected}
                                                        onToggle={toggleProviderSelection}
                                                        onShowOnMap={handleProviderClick}
                                                    />
                                                );
                                            })}
                                        </AvailableGrid>
                                    ) : (
                                        <EmptyCard>
                                            Сейчас нет доступных вариантов в
                                            выбранном радиусе.
                                        </EmptyCard>
                                    )}
                                </AvailableSection>
                            </ContentFlow>
                        )}
                    </>
                )}
            </HomeShell>
                        {tenderMode && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '24px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 1150,
                        width: 'calc(100% - 32px)',
                        maxWidth: '620px',
                        background: 'rgba(255, 255, 255, 0.96)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '18px',
                        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.08)',
                        padding: '12px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        flexWrap: 'wrap',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                            style={{
                                background: selectedProviders.length > 0 ? '#2563eb' : '#94a3b8',
                                color: '#ffffff',
                                width: '34px',
                                height: '34px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '14px',
                                boxShadow: selectedProviders.length > 0 ? '0 4px 10px rgba(37, 99, 235, 0.3)' : 'none',
                            }}
                        >
                            {selectedProviders.length}
                        </div>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                                {selectedProviders.length > 0
                                    ? `Выбрано: ${selectedProviders.length} ${
                                          selectedProviders.length === 1
                                              ? 'мастер'
                                              : selectedProviders.length < 5
                                              ? 'мастера'
                                              : 'мастеров'
                                      }`
                                    : 'Мастера не выбраны'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                                {selectedProviders.length > 0
                                    ? 'Нажмите «Отправить заявку»'
                                    : 'Нажимайте на карточки для выбора'}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {selectedProviders.length > 0 ? (
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={handleDeselectAll}
                            >
                                Сбросить
                            </Button>
                        ) : (
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={handleSelectAllInRadius}
                            >
                                Выбрать всех
                            </Button>
                        )}
                        <Button
                            size="small"
                            variant="contained"
                            disabled={selectedProviders.length === 0}
                            onClick={() => setIsCreateOrderOpen(true)}
                        >
                            Отправить ({selectedProviders.length})
                        </Button>
                        <button
                            type="button"
                            onClick={() => {
                                setTenderMode(false);
                                setSelectedProviders([]);
                            }}
                            style={{
                                border: 'none',
                                background: '#f1f5f9',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#64748b',
                                fontSize: '16px',
                                fontWeight: 700,
                            }}
                            title="Выйти из режима мульти-рассылки"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
            <GeolocationPrompt />

            {isCreateOrderOpen && selectedProviders.length > 0 && (
                <CreateOrderModal
                    open={isCreateOrderOpen}
                    onClose={() => setIsCreateOrderOpen(false)}
                    providers={selectedProviders}
                />
            )}
        </PageRoot>

    );
};
