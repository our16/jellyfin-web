import DashboardIcon from '@mui/icons-material/Dashboard';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { ThemeProvider } from '@mui/material/styles';
import React, { useCallback } from 'react';
import {
    RouterProvider,
    createHashRouter,
    Outlet,
    useLocation
} from 'react-router-dom';

import { DASHBOARD_APP_PATHS, DASHBOARD_APP_ROUTES } from 'apps/dashboard/routes/routes';
import { APP_ROUTES as MODERN_APP_ROUTES } from 'apps/modern/routes/routes';
import { APP_ROUTES as LEGACY_APP_ROUTES } from 'apps/legacy/routes/routes';
import { WIZARD_APP_ROUTES } from 'apps/wizard/routes/routes';
import AppHeader from 'components/AppHeader';
import Backdrop from 'components/Backdrop';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';
import layoutManager from 'components/layoutManager';
import BangRedirect from 'components/router/BangRedirect';
import { createRouterHistory } from 'components/router/routerHistory';
import appTheme from 'themes';
import { ThemeStorageManager } from 'themes/themeStorageManager';

const router = createHashRouter([
    {
        element: <RootAppLayout />,
        children: [
            ...(layoutManager.modern ? MODERN_APP_ROUTES : LEGACY_APP_ROUTES),
            ...DASHBOARD_APP_ROUTES,
            ...WIZARD_APP_ROUTES,
            {
                path: '!/*',
                Component: BangRedirect
            }
        ]
    }
]);

export const history = createRouterHistory(router);

export default function RootAppRouter() {
    return <RouterProvider router={router} />;
}

/**
 * Layout component that renders legacy components required on all pages.
 * NOTE: The app will crash if these get removed from the DOM.
 */
function RootAppLayout() {
    const location = useLocation();
    const { user } = useApi();
    const isNewLayoutPath = Object.values(DASHBOARD_APP_PATHS)
        .some(path => location.pathname.startsWith(`/${path}`));
    const isDashboard = location.pathname.startsWith('/dashboard');

    const onClickDashboard = useCallback(() => {
        window.location.hash = '#/dashboard';
    }, []);

    return (
        <ThemeProvider
            theme={appTheme}
            defaultMode='dark'
            storageManager={ThemeStorageManager}
        >
            <Backdrop />
            <AppHeader isHidden={layoutManager.modern || isNewLayoutPath} />

            {user?.Policy?.IsAdministrator && !layoutManager.modern && !isDashboard && !isNewLayoutPath && (
                <Tooltip title={globalize.translate('TabDashboard')}>
                    <IconButton
                        size='large'
                        aria-label={globalize.translate('TabDashboard')}
                        color='inherit'
                        onClick={onClickDashboard}
                        sx={{
                            position: 'fixed',
                            top: 8,
                            right: 48,
                            zIndex: 1300,
                            color: 'rgba(255,255,255,0.7)',
                            '&:hover': { color: 'white' }
                        }}
                    >
                        <DashboardIcon />
                    </IconButton>
                </Tooltip>
            )}

            <Outlet />
        </ThemeProvider>
    );
}
