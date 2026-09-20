import { useEffect, useState } from "react";
import { Box, Dialog, IconButton } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { getAsset } from "@modules/media/api";
import { palette } from "./styles";

export function OrderPhotos({ assetIds }: { assetIds: string[] }) {
    const [urls, setUrls] = useState<string[]>([]);
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        Promise.all(
            assetIds.map((id) =>
                getAsset(id)
                    .then(
                        (asset) =>
                            asset.urls?.medium?.jpeg ||
                            asset.urls?.medium?.webp ||
                            asset.urls?.thumb?.jpeg ||
                            asset.urls?.thumb?.webp ||
                            asset.urls?.original ||
                            null
                    )
                    .catch(() => null)
            )
        ).then((resolved) => {
            if (!cancelled) {
                setUrls(resolved.filter((u): u is string => Boolean(u)));
            }
        });
        return () => {
            cancelled = true;
        };
    }, [assetIds.join(",")]);

    if (urls.length === 0) return null;
    return (
        <Box sx={{ display: "flex", gap: 0.85, flexWrap: "wrap", mt: 1 }}>
            {urls.map((url) => (
                <Box
                    key={url}
                    component="img"
                    src={url}
                    alt="Фото заявки"
                    onClick={() => setSelectedUrl(url)}
                    sx={{
                        width: 84,
                        height: 84,
                        objectFit: "cover",
                        borderRadius: 1.5,
                        border: `1px solid ${palette.border}`,
                        cursor: "zoom-in",
                        transition: "transform 0.15s ease",
                        "&:hover": { transform: "scale(1.03)" },
                    }}
                />
            ))}
            <Dialog
                open={Boolean(selectedUrl)}
                onClose={() => setSelectedUrl(null)}
                maxWidth="lg"
                PaperProps={{
                    sx: {
                        background: "transparent",
                        boxShadow: "none",
                        overflow: "visible",
                    },
                }}
            >
                <IconButton
                    aria-label="Закрыть фото"
                    onClick={() => setSelectedUrl(null)}
                    sx={{
                        position: "absolute",
                        right: -12,
                        top: -12,
                        zIndex: 1,
                        color: "#fff",
                        background: "rgba(15, 23, 42, 0.8)",
                        "&:hover": { background: "rgba(15, 23, 42, 0.95)" },
                    }}
                >
                    <CloseRoundedIcon />
                </IconButton>
                {selectedUrl && (
                    <Box
                        component="img"
                        src={selectedUrl}
                        alt="Фото заявки в полном размере"
                        sx={{
                            display: "block",
                            maxWidth: "min(90vw, 1100px)",
                            maxHeight: "85vh",
                            objectFit: "contain",
                            borderRadius: 2,
                        }}
                    />
                )}
            </Dialog>
        </Box>
    );
}
