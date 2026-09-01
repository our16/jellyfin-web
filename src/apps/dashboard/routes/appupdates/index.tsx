import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadIcon from '@mui/icons-material/Upload';
import FolderIcon from '@mui/icons-material/Folder';
import SaveIcon from '@mui/icons-material/Save';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadDoneIcon from '@mui/icons-material/DownloadDone';
import useTheme from '@mui/material/styles/useTheme';
import { useMaterialReactTable } from 'material-react-table';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import TablePage, { DEFAULT_TABLE_OPTIONS } from 'apps/dashboard/components/table/TablePage';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';
import ConfirmDialog from 'components/ConfirmDialog';
import Loading from 'components/loading/LoadingComponent';

interface AppRelease {
    Id: string;
    AppVersion: string;
    AppVersionCode: number;
    ReleaseDate: string;
    Channel: string;
    Changelog: Record<string, string> | null;
    DownloadSize: number;
    Mandatory: boolean;
}

export const Component = () => {
    const { api } = useApi();
    const theme = useTheme();
    const [ releases, setReleases ] = useState<AppRelease[]>([]);
    const [ isLoading, setIsLoading ] = useState(true);
    const [ isError, setIsError ] = useState(false);
    const [ isConfirmDeleteOpen, setIsConfirmDeleteOpen ] = useState(false);
    const [ releaseToDelete, setReleaseToDelete ] = useState<string | null>(null);
    const [ apkDirectory, setApkDirectory ] = useState('');
    const [ isDirectoryDefault, setIsDirectoryDefault ] = useState(true);
    const [ isUploading, setIsUploading ] = useState(false);
    const [ uploadVersion, setUploadVersion ] = useState('');
    const [ uploadChannel, setUploadChannel ] = useState('stable');

    const apiHeaders = useMemo(() => ({
        'Authorization': `MediaBrowser Token="${api?.accessToken}"`,
        'X-Emby-Authorization': 'MediaBrowser Client="dashboard", Device="web", Version="1.0"'
    }), [api?.accessToken]);

    const fetchReleases = useCallback(async () => {
        if (!api) return;
        try {
            const response = await fetch(`${api.basePath}/AppUpdate/Releases?limit=100`, {
                headers: apiHeaders as Record<string, string>
            });
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setReleases(data.Releases || []);
        } catch {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, [api, apiHeaders]);

    const fetchDirectory = useCallback(async () => {
        if (!api) return;
        try {
            const response = await fetch(`${api.basePath}/AppUpdate/Config/Directory`, {
                headers: apiHeaders as Record<string, string>
            });
            if (response.ok) {
                const data = await response.json();
                setApkDirectory(data.directory);
                setIsDirectoryDefault(data.isDefault);
            }
        } catch {
            // ignore
        }
    }, [api, apiHeaders]);

    useEffect(() => {
        fetchReleases();
        fetchDirectory();
    }, [fetchReleases, fetchDirectory]);

    const handleDelete = useCallback(async () => {
        if (!api || !releaseToDelete) return;
        try {
            const response = await fetch(`${api.basePath}/AppUpdate/Releases/${releaseToDelete}`, {
                method: 'DELETE',
                headers: apiHeaders as Record<string, string>
            });
            if (response.ok) {
                setReleases(prev => prev.filter(r => r.Id !== releaseToDelete));
            }
        } catch {
            // ignore
        } finally {
            setReleaseToDelete(null);
            setIsConfirmDeleteOpen(false);
        }
    }, [api, apiHeaders, releaseToDelete]);

    const handleSaveDirectory = useCallback(async () => {
        if (!api || !apkDirectory) return;
        try {
            const response = await fetch(`${api.basePath}/AppUpdate/Config/Directory`, {
                method: 'POST',
                headers: {
                    ...apiHeaders as Record<string, string>,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ directory: apkDirectory })
            });
            if (response.ok) {
                setIsDirectoryDefault(false);
            }
        } catch {
            // ignore
        }
    }, [api, apiHeaders, apkDirectory]);

    const handleUpload = useCallback(async () => {
        if (!api || !uploadVersion) return;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.apk';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            setIsUploading(true);
            try {
                const versionParts = uploadVersion.split('.').map(Number);
                const versionCode = (versionParts[0] || 0) * 1000000 + (versionParts[1] || 0) * 10000 + (versionParts[2] || 0) * 100;

                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch(
                    `${api.basePath}/AppUpdate/Upload?versionString=${encodeURIComponent(uploadVersion)}&versionCode=${versionCode}&channel=${encodeURIComponent(uploadChannel)}`,
                    {
                        method: 'POST',
                        headers: apiHeaders as Record<string, string>,
                        body: formData
                    }
                );

                if (response.ok) {
                    setUploadVersion('');
                    fetchReleases();
                }
            } catch {
                // ignore
            } finally {
                setIsUploading(false);
            }
        };
        input.click();
    }, [api, apiHeaders, uploadVersion, uploadChannel, fetchReleases]);

    const formatSize = useCallback((size: number) => {
        if (size >= 1048576) return `${(size / 1048576).toFixed(1)} MB`;
        return `${(size / 1024).toFixed(1)} KB`;
    }, []);

    const columns = useMemo(() => [
        { accessorKey: 'AppVersion', header: globalize.translate('LabelVersion'), size: 100 },
        { accessorKey: 'AppVersionCode', header: globalize.translate('LabelVersionCode'), size: 120 },
        { accessorKey: 'Channel', header: globalize.translate('LabelChannel'), size: 100 },
        { accessorKey: 'ReleaseDate', header: globalize.translate('LabelReleaseDate'), size: 200 },
        {
            accessorKey: 'DownloadSize',
            header: globalize.translate('LabelSize'),
            size: 100,
            Cell: ({ row }: any) => formatSize(row.original.DownloadSize)
        },
        {
            accessorKey: 'Mandatory',
            header: globalize.translate('LabelMandatory'),
            size: 100,
            Cell: ({ row }: any) => (
                <Chip
                    label={row.original.Mandatory ? 'Yes' : 'No'}
                    color={row.original.Mandatory ? 'error' : 'default'}
                    size='small'
                />
            )
        }
    ], [formatSize]);

    const table = useMaterialReactTable({
        ...DEFAULT_TABLE_OPTIONS,
        columns,
        data: releases,
        state: { isLoading },
        enableRowActions: true,
        positionActionsColumn: 'last',
        displayColumnDefOptions: {
            'mrt-row-actions': { header: '', size: 25 }
        },
        renderTopToolbarCustomActions: () => (
            <Stack direction='row' spacing={1}>
                <Button
                    variant='contained'
                    startIcon={<UploadIcon />}
                    onClick={handleUpload}
                    disabled={isUploading || !uploadVersion}
                    sx={{ borderRadius: '8px', textTransform: 'none' }}
                >
                    {isUploading ? globalize.translate('LabelUploading') : globalize.translate('HeaderUploadApk')}
                </Button>
            </Stack>
        ),
        renderRowActions: ({ row }) => (
            <Tooltip title={globalize.translate('Delete')}>
                <IconButton color='error' onClick={() => { setReleaseToDelete(row.original.Id); setIsConfirmDeleteOpen(true); }}>
                    <DeleteIcon />
                </IconButton>
            </Tooltip>
        )
    });

    if (isLoading) {
        return <Loading />;
    }

    return (
        <>
            <ConfirmDialog
                open={isConfirmDeleteOpen}
                title={globalize.translate('HeaderDeleteRelease')}
                text={globalize.translate('MessageConfirmDeleteRelease')}
                confirmButtonColor='error'
                confirmButtonText={globalize.translate('Delete')}
                onConfirm={handleDelete}
                onCancel={() => { setReleaseToDelete(null); setIsConfirmDeleteOpen(false); }}
            />

            <TablePage
                id='appUpdatesPage'
                title={globalize.translate('HeaderAppUpdates')}
                className='mainAnimatedPage type-interior'
                table={table}
                isError={isError}
                errorMessage={globalize.translate('AppUpdatesLoadError')}
            >
                <Stack spacing={2} sx={{ mt: 2, px: 2, pb: 3 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            borderRadius: '12px',
                            border: '1px solid',
                            borderColor: 'divider',
                            background: `linear-gradient(135deg, ${theme.palette.primary.main}08, ${theme.palette.primary.main}03)`
                        }}
                    >
                        <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: 'primary.main', color: 'primary.contrastText', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <DownloadDoneIcon />
                        </Box>
                        <Box>
                            <Typography variant='h4' fontWeight={700}>{releases.length}</Typography>
                            <Typography variant='body2' color='text.secondary'>{globalize.translate('HeaderAppUpdates')}</Typography>
                        </Box>
                        <Box sx={{ flex: 1 }} />
                        <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: 'success.main', color: 'success.contrastText', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FolderIcon />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant='body2' fontWeight={600} noWrap>{apkDirectory || 'Default'}</Typography>
                            <Typography variant='body2' color='text.secondary'>APK Storage</Typography>
                        </Box>
                        {isDirectoryDefault && <Chip label='Default' size='small' variant='outlined' />}
                    </Paper>

                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <Card elevation={0} sx={{ flex: 1, borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
                            <CardHeader
                                avatar={<FolderIcon color='primary' />}
                                title={globalize.translate('HeaderApkDirectory')}
                                subheader={globalize.translate('LabelApkDirectoryHelp')}
                                titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
                                subheaderTypographyProps={{ variant: 'body2' }}
                            />
                            <Divider />
                            <CardContent>
                                <Stack direction='row' spacing={1} alignItems='center'>
                                    <TextField
                                        fullWidth
                                        size='small'
                                        value={apkDirectory}
                                        onChange={(e) => setApkDirectory(e.target.value)}
                                        placeholder={globalize.translate('LabelApkDirectoryPlaceholder')}
                                        variant='outlined'
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                    />
                                    <Button
                                        variant='contained'
                                        startIcon={<SaveIcon />}
                                        onClick={handleSaveDirectory}
                                        sx={{ minWidth: 100, borderRadius: '8px', textTransform: 'none' }}
                                    >
                                        {globalize.translate('Save')}
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>

                        <Card elevation={0} sx={{ flex: 1, borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
                            <CardHeader
                                avatar={<CloudUploadIcon color='primary' />}
                                title={globalize.translate('HeaderUploadRelease')}
                                subheader='Upload a new APK version to the server'
                                titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
                                subheaderTypographyProps={{ variant: 'body2' }}
                            />
                            <Divider />
                            <CardContent>
                                <Stack direction='row' spacing={1} alignItems='center'>
                                    <TextField
                                        size='small'
                                        value={uploadVersion}
                                        onChange={(e) => setUploadVersion(e.target.value)}
                                        placeholder='1.0.0'
                                        label={globalize.translate('LabelVersion')}
                                        variant='outlined'
                                        sx={{ width: 130, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                    />
                                    <TextField
                                        size='small'
                                        select
                                        value={uploadChannel}
                                        onChange={(e) => setUploadChannel(e.target.value)}
                                        label={globalize.translate('LabelChannel')}
                                        variant='outlined'
                                        sx={{ width: 130, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                        slotProps={{ select: { native: true } }}
                                    >
                                        <option value='stable'>Stable</option>
                                        <option value='beta'>Beta</option>
                                        <option value='alpha'>Alpha</option>
                                    </TextField>
                                    <Button
                                        variant='contained'
                                        color='secondary'
                                        startIcon={<UploadIcon />}
                                        onClick={handleUpload}
                                        disabled={isUploading || !uploadVersion}
                                        sx={{ borderRadius: '8px', textTransform: 'none', whiteSpace: 'nowrap' }}
                                    >
                                        {isUploading ? globalize.translate('LabelUploading') : globalize.translate('HeaderUploadApk')}
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Stack>
                </Stack>
            </TablePage>
        </>
    );
};

Component.displayName = 'AppUpdatesPage';
