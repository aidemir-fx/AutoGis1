import React from "react";
import { Box, Paper, Stack, Link as MuiLink } from "@mui/material";
import { NavigateNext as NavigateNextIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { hasCapability } from "@common/lib/userAccess";
import { useAuth, useUserProfile } from "@common/hooks";
import {
    LogoutIcon,
    OrganizationIcon,
    UserIcon,
} from "@common/icons";
import { useForm, Controller } from "react-hook-form";
import {
    ActivityTypeIconWrapper,
    AvatarHint,
    AvatarHintText,
    AvatarWrapper,
    BlockSubtitle,
    BlockTitle,
    Header,
    SubmitButtonWrapper,
    StyledPaper,
    TitleWrapper,
    UserDataWrapper,
    UserIconWrapper,
} from "./styles";
import { AvatarUpload, Button, TextField } from "@common/components";
import { useQuery } from "@tanstack/react-query";
import { http } from "@common/lib/http";
import { BusinessApplication } from "../ForBusiness/types";

type ProfileFormData = {
    name: string;
    contactNumber: string;
};

export function Dashboard() {
    const navigate = useNavigate();
    const { profile, updateProfile, isUpdatingProfile } = useUserProfile();
    const { logout } = useAuth();

    const { data: businessApplication } = useQuery({
        queryKey: ["businessApplication", "me"],
        queryFn: async () => {
            const response = await http.get<{
                application: BusinessApplication | null;
            }>("/business-applications/me");
            return response.data?.application ?? null;
        },
        enabled: !!profile?.id,
        staleTime: 60_000,
    });

    const form = useForm<ProfileFormData>({
        defaultValues: {
            name: profile?.name || "",
            contactNumber: profile?.contactNumber || "",
        },
    });

    // Обновляем форму при изменении профиля
    React.useEffect(() => {
        if (profile) {
            form.reset({
                name: profile.name || "",
                contactNumber: profile.contactNumber || "",
            });
        }
    }, [profile?.name, profile?.contactNumber, profile?.id, form]);

    if (!profile) return null;

    const hasProfessionalCabinetAccess = hasCapability(
        profile,
        "professionalCabinet",
    );
    const hasPendingProfessionalApplication =
        businessApplication?.status === "pending" ||
        businessApplication?.status === "needs_revision";
    const canOpenProfessionalSection =
        hasProfessionalCabinetAccess || hasPendingProfessionalApplication;

    const handleProfessionalCabinetClick = () => {
        navigate(
            hasProfessionalCabinetAccess
                ? "/cabinet/professional"
                : "/cabinet/for-business",
        );
    };

    const handleForBusinessClick = () => {
        navigate("/cabinet/for-business");
    };

    const onSubmit = (data: ProfileFormData) => {
        updateProfile(data);
    };

    return (
        <div>
            <Paper
                sx={{
                    p: 3,
                    width: "100%",
                    borderRadius: "14px",
                    marginBottom: "24px",
                }}
            >
                <Stack spacing={3}>
                    <Box>
                        <Header>
                            <UserIconWrapper>
                                <UserIcon />
                            </UserIconWrapper>
                            Основная информация
                        </Header>
                        <Box
                            sx={{
                                alignItems: "center",
                                gap: 2,
                                mb: 2,
                            }}
                        >
                            <AvatarWrapper>
                                <AvatarUpload
                                    entityId={profile.id}
                                    fallbackText={profile.name ?? undefined}
                                />
                                <AvatarHint>
                                    <span>Фото профиля</span>
                                    <AvatarHintText>
                                        Нажмите, чтобы загрузить или изменить фото
                                    </AvatarHintText>
                                </AvatarHint>
                            </AvatarWrapper>

                            <form onSubmit={form.handleSubmit(onSubmit)}>
                                <UserDataWrapper>
                                    <Controller
                                        name="name"
                                        control={form.control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="Имя и фамилия"
                                                fullWidth
                                            />
                                        )}
                                    />
                                    <Controller
                                        name="contactNumber"
                                        control={form.control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="Номер для связи"
                                                fullWidth
                                            />
                                        )}
                                    />
                                </UserDataWrapper>
                                <SubmitButtonWrapper>
                                    <Button
                                        type="submit"
                                        disabled={
                                            !form.formState.isDirty ||
                                            isUpdatingProfile
                                        }
                                        isLoading={isUpdatingProfile}
                                        isFullWidth
                                    >
                                        {isUpdatingProfile
                                            ? "Сохранение..."
                                            : "Сохранить"}
                                    </Button>
                                </SubmitButtonWrapper>
                            </form>
                        </Box>
                    </Box>
                </Stack>
            </Paper>

            {/* Профкабинет/заявка доступны сразу после подачи заявки. */}
            {canOpenProfessionalSection && (
                <Box>
                    <StyledPaper
                        sx={{
                            p: 2,
                            width: "100%",
                            borderRadius: "14px",
                            marginBottom: "24px",
                            cursor: "pointer",
                            boxShadow: "none",
                            border: "1px solid #0000001a",
                        }}
                        onClick={handleProfessionalCabinetClick}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                }}
                            >
                                <ActivityTypeIconWrapper>
                                    <OrganizationIcon />
                                </ActivityTypeIconWrapper>
                                <TitleWrapper>
                                    <BlockTitle>
                                        Профессиональный кабинет
                                    </BlockTitle>
                                    <BlockSubtitle>
                                        {hasProfessionalCabinetAccess
                                            ? "Типы деятельности и заявки"
                                            : "Заявка на рассмотрении"}
                                    </BlockSubtitle>
                                </TitleWrapper>
                            </Box>
                            <NavigateNextIcon />
                        </Box>
                    </StyledPaper>
                </Box>
            )}

            {/* Неброский текстовый пункт "Для бизнеса" */}
            {!canOpenProfessionalSection && (
                <Box sx={{ mt: 1, mb: 2, textAlign: "center" }}>
                    <MuiLink
                        component="button"
                        type="button"
                        underline="hover"
                        onClick={handleForBusinessClick}
                        sx={{
                            color: "text.secondary",
                            fontSize: 14,
                            cursor: "pointer",
                        }}
                    >
                        Для бизнеса
                    </MuiLink>
                </Box>
            )}

            <Box sx={{ mt: 2 }}>
                <Button
                    variant="outlined"
                    onClick={logout}
                    isFullWidth
                    icon={<LogoutIcon />}
                >
                    Выйти из аккаунта
                </Button>
            </Box>
        </div>
    );
}
