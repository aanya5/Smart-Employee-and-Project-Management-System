import React, { useEffect, useState } from "react";
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Divider,
    Stack,
    Typography,
} from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import { employeeApi } from "../api/client";
import { useNotify } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
    const { notify } = useNotify();
    const { updateUser } = useAuth();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadProfile = async () => {
        try {
            setLoading(true);

            const { data } = await employeeApi.getCurrentUser();

            setUser(data.data);
        } catch (err) {
            notify(
                err.response?.data?.message || "Failed to load profile",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const handleUpload = async (e) => {
        const file = e.target.files[0];

        if (!file) return;

        try {
            const { data } = await employeeApi.uploadMyProfile(file);

            setUser(data.data);
            updateUser(data.data);
            notify("Profile image updated", "success");
        } catch (err) {
            notify(
                err.response?.data?.message || "Upload failed",
                "error"
            );
        }
    };

    const handleRemoveProfile = async () => {
        try {
            const { data } = await employeeApi.removeMyProfile();

            setUser(data.data);
            updateUser(data.data);
            notify("Profile image removed", "success");
        } catch (err) {
            notify(
                err.response?.data?.message || "Failed to remove profile image",
                "error"
            );
        }
    };

    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    mt: 8,
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Card
            elevation={0}
            sx={{
                maxWidth: 700,
                mx: "auto",
                border: "1px solid rgba(0,0,0,0.08)",
            }}
        >
            <CardContent>

                <Stack
                    spacing={3}
                    alignItems="center"
                >
                    <Avatar
                        src={
                            user?.profileImage
                                ? `http://localhost:8080/uploads/profile-images/${user.profileImage}`
                                : undefined
                        }
                        sx={{
                            width: 140,
                            height: 140,
                        }}
                    >
                        {!user?.profileImage &&
                            `${user?.firstName?.charAt(0) || ""}${user?.lastName?.charAt(0) || ""}`}
                    </Avatar>

                    <Button
                        component="label"
                        variant="contained"
                        startIcon={<UploadIcon />}
                    >
                        Upload Photo

                        <input
                            hidden
                            type="file"
                            accept="image/*"
                            onChange={handleUpload}
                        />
                    </Button>
                    {user?.profileImage && (
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={handleRemoveProfile}
                        >
                            Remove Photo
                        </Button>
                    )}
                </Stack>

                <Divider sx={{ my: 4 }} />

                <Stack spacing={2}>

                    <Box>
                        <Typography color="text.secondary">
                            Name
                        </Typography>

                        <Typography variant="h6">
                            {user?.fullName}
                        </Typography>
                    </Box>

                    <Box>
                        <Typography color="text.secondary">
                            Email
                        </Typography>

                        <Typography>
                            {user?.email}
                        </Typography>
                    </Box>

                    <Box>
                        <Typography color="text.secondary">
                            Department
                        </Typography>

                        <Typography>
                            {user?.department || "-"}
                        </Typography>
                    </Box>

                    <Box>
                        <Typography color="text.secondary">
                            Designation
                        </Typography>

                        <Typography>
                            {user?.designation || "-"}
                        </Typography>
                    </Box>

                    <Box>
                        <Typography color="text.secondary">
                            Phone
                        </Typography>

                        <Typography>
                            {user?.phone || "-"}
                        </Typography>
                    </Box>

                    <Box>
                        <Typography color="text.secondary">
                            Role
                        </Typography>

                        <Typography>
                            {user?.role}
                        </Typography>
                    </Box>

                </Stack>

            </CardContent>
        </Card>
    );
}