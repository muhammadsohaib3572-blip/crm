import { UserRole } from '@/types/auth';

export interface NavItem {
  name: string;
  href: string;
  iconName: string;
  roles: UserRole[];
}

/**
 * Master navigation config.
 * Each item declares exactly which roles can see it.
 * The sidebar renders only items the current user's role is in.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    iconName: 'LayoutDashboard',
    roles: ['ADMIN', 'MANAGER', 'BUSINESS', 'AGRONOMY', 'HARDWARE', 'ACCOUNTS', 'EMPLOYEE'],
  },
  // ── Clients ──
  {
    name: 'Clients',
    href: '/clients',
    iconName: 'Users',
    roles: ['ADMIN', 'MANAGER', 'BUSINESS', 'AGRONOMY', 'ACCOUNTS'],
  },
  // ── Leads / Sales ──
  {
    name: 'Leads & Pipeline',
    href: '/leads',
    iconName: 'TrendingUp',
    roles: ['ADMIN', 'MANAGER', 'BUSINESS'],
  },
  // ── Agronomy ──
  {
    name: 'Field Reports',
    href: '/reports',
    iconName: 'FileText',
    roles: ['ADMIN', 'MANAGER', 'AGRONOMY'],
  },
  // ── Devices ──
  {
    name: 'Devices',
    href: '/devices',
    iconName: 'Cpu',
    roles: ['ADMIN', 'MANAGER', 'HARDWARE', 'AGRONOMY'],
  },
  // ── Inventory / Components ──
  {
    name: 'Inventory',
    href: '/inventory',
    iconName: 'Package',
    roles: ['ADMIN', 'MANAGER', 'HARDWARE'],
  },
  {
    name: 'Components',
    href: '/components',
    iconName: 'CircuitBoard',
    roles: ['ADMIN', 'MANAGER', 'HARDWARE'],
  },
  // ── Issues / Tickets ──
  {
    name: 'Issues & Tickets',
    href: '/issues',
    iconName: 'AlertCircle',
    roles: ['ADMIN', 'MANAGER', 'BUSINESS'],
  },
  // ── Billing ──
  {
    name: 'Billing',
    href: '/billing',
    iconName: 'CreditCard',
    roles: ['ADMIN', 'MANAGER', 'ACCOUNTS'],
  },
  // ── Tasks ──
  {
    name: 'Tasks',
    href: '/tasks',
    iconName: 'CheckSquare',
    roles: ['ADMIN', 'MANAGER', 'BUSINESS', 'AGRONOMY', 'HARDWARE', 'ACCOUNTS', 'EMPLOYEE'],
  },
  // ── Performance ──
  {
    name: 'Performance',
    href: '/performance',
    iconName: 'BarChart2',
    roles: ['ADMIN', 'MANAGER', 'BUSINESS', 'AGRONOMY', 'HARDWARE', 'ACCOUNTS', 'EMPLOYEE'],
  },
  // ── Notifications ──
  {
    name: 'Notifications',
    href: '/notifications',
    iconName: 'Bell',
    roles: ['ADMIN', 'MANAGER', 'BUSINESS', 'AGRONOMY', 'HARDWARE', 'ACCOUNTS', 'EMPLOYEE'],
  },
  // ── Admin-only ──
  {
    name: 'Activity Logs',
    href: '/activity-logs',
    iconName: 'Activity',
    roles: ['ADMIN', 'MANAGER'],
  },
  {
    name: 'Users',
    href: '/users',
    iconName: 'UserCog',
    roles: ['ADMIN', 'MANAGER'],
  },
];

/**
 * Route-to-allowed-roles map used by ProtectedRoute.
 * Prefix matching: /devices matches /devices/[id] etc.
 */
export const ROUTE_ROLES: Record<string, UserRole[]> = {
  '/dashboard':      ['ADMIN', 'MANAGER', 'BUSINESS', 'AGRONOMY', 'HARDWARE', 'ACCOUNTS', 'EMPLOYEE'],
  '/clients':        ['ADMIN', 'MANAGER', 'BUSINESS', 'AGRONOMY', 'ACCOUNTS'],
  '/leads':          ['ADMIN', 'MANAGER', 'BUSINESS'],
  '/reports':        ['ADMIN', 'MANAGER', 'AGRONOMY'],
  '/devices':        ['ADMIN', 'MANAGER', 'HARDWARE', 'AGRONOMY'],
  '/inventory':      ['ADMIN', 'MANAGER', 'HARDWARE'],
  '/components':     ['ADMIN', 'MANAGER', 'HARDWARE'],
  '/issues':         ['ADMIN', 'MANAGER', 'BUSINESS'],
  '/billing':        ['ADMIN', 'MANAGER', 'ACCOUNTS'],
  '/tasks':          ['ADMIN', 'MANAGER', 'BUSINESS', 'AGRONOMY', 'HARDWARE', 'ACCOUNTS', 'EMPLOYEE'],
  '/performance':    ['ADMIN', 'MANAGER', 'BUSINESS', 'AGRONOMY', 'HARDWARE', 'ACCOUNTS', 'EMPLOYEE'],
  '/notifications':  ['ADMIN', 'MANAGER', 'BUSINESS', 'AGRONOMY', 'HARDWARE', 'ACCOUNTS', 'EMPLOYEE'],
  '/activity-logs':  ['ADMIN', 'MANAGER'],
  '/users':          ['ADMIN', 'MANAGER'],
  '/unauthorized':   ['ADMIN', 'MANAGER', 'BUSINESS', 'AGRONOMY', 'HARDWARE', 'ACCOUNTS', 'EMPLOYEE'],
};

export function hasRouteAccess(pathname: string, role: UserRole): boolean {
  // Find matching route (prefix match for dynamic routes)
  const matchingRoute = Object.keys(ROUTE_ROLES).find((route) =>
    pathname === route || pathname.startsWith(route + '/')
  );
  if (!matchingRoute) return true; // public route
  return ROUTE_ROLES[matchingRoute]?.includes(role) ?? false;
}
