import Topbar from './Topbar'
import Sidebar from './Sidebar'
import type { NavSection } from './Sidebar'

interface PortalShellProps {
  children: React.ReactNode
  userFullName: string
  userRole: string
  initials: string
  navigation: NavSection[]
}

export default function PortalShell({
  children,
  userFullName,
  userRole,
  initials,
  navigation,
}: PortalShellProps) {
  return (
    <div className="portal-shell">
      <Topbar
        userFullName={userFullName}
        userRole={userRole}
        initials={initials}
      />
      <div className="portal-body">
        <Sidebar
          navigation={navigation}
          userFullName={userFullName}
          userRole={userRole}
          initials={initials}
        />
        <main className="portal-main">
          {children}
        </main>
      </div>
    </div>
  )
}