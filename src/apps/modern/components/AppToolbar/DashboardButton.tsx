import DashboardIcon from '@mui/icons-material/Dashboard';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import React, { useCallback, type FC } from 'react';

import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';

const DashboardButton: FC = () => {
    const { user } = useApi();

    const onClick = useCallback(() => {
        window.location.assign('#/dashboard');
    }, []);

    if (!user) return null;

    return (
        <Tooltip title={globalize.translate('TabDashboard')}>
            <IconButton
                size='large'
                aria-label={globalize.translate('TabDashboard')}
                color='inherit'
                onClick={onClick}
            >
                <DashboardIcon />
            </IconButton>
        </Tooltip>
    );
};

export default DashboardButton;
