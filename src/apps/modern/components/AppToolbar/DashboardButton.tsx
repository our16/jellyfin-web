import DashboardIcon from '@mui/icons-material/Dashboard';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import React, { type FC } from 'react';
import { Link } from 'react-router-dom';

import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';

const DashboardButton: FC = () => {
    const { user } = useApi();

    if (!user?.Policy?.IsAdministrator) return null;

    return (
        <Tooltip title={globalize.translate('TabDashboard')}>
            <IconButton
                size='large'
                aria-label={globalize.translate('TabDashboard')}
                color='inherit'
                component={Link}
                to='/dashboard'
            >
                <DashboardIcon />
            </IconButton>
        </Tooltip>
    );
};

export default DashboardButton;
