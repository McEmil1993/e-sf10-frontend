import Chart from "@/app/components/Chart/Chart";
import Table from "@/app/components/Table/Table";
import type { TableColumn } from "@/app/types/tableTypes";
import Widget from "@/app/components/Widget/Widget";
import type { UserTableRow } from "@/app/types/userTypes";
import {
  formatDate,
  getDashboardStats,
  getPrimaryUserRole,
  getRoleTone,
  getStatusTone,
  getUsers,
} from "@/app/utils/mockData";

function BagIcon() {
  return (
    <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24">
      <path d="M7 8V6a5 5 0 0 1 10 0v2h3l-1.1 11H5.1L4 8h3Zm2 0h6V6a3 3 0 1 0-6 0v2Zm1.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" fill="currentColor" />
    </svg>
  );
}

function BarIcon() {
  return (
    <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24">
      <path d="M4 20V9h3v11H4Zm6 0V4h3v16h-3Zm6 0v-7h3v7h-3Z" fill="currentColor" />
    </svg>
  );
}

function UserPlusIcon() {
  return (
    <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24">
      <path d="M15 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-8 8v-1c0-2.67 5.33-4 8-4 1 0 2.11.1 3.2.31A5.96 5.96 0 0 0 18 17v3H7Zm14-6h-2v-2h-2v-2h2V8h2v2h2v2h-2v2Z" fill="currentColor" />
    </svg>
  );
}

const roleToneMap = {
  admin: getRoleTone("admin"),
  developer: getRoleTone("developer"),
  editor: getRoleTone("editor"),
  staff: getRoleTone("staff"),
  user: getRoleTone("user"),
};

const statusToneMap = {
  active: getStatusTone("active"),
  inactive: getStatusTone("inactive"),
  banned: getStatusTone("banned"),
};

const userColumns: TableColumn<UserTableRow>[] = [
  {
    key: "name",
    header: "Name",
    type: "stacked",
    showAvatar: true,
    avatarImageKey: "avatar",
    avatarFallbackKey: "name",
    secondaryKey: "email",
    valueClassName: "font-semibold text-slate-950",
    secondaryValueClassName: "text-xs text-muted",
  },
  {
    key: "role",
    header: "Role",
    type: "badge",
    badgeClassName: "inline-flex rounded px-2 py-1 text-xs font-semibold",
    toneMap: roleToneMap,
  },
  {
    key: "status",
    header: "Status",
    type: "badge",
    badgeClassName: "inline-flex rounded px-2 py-1 text-xs font-semibold ring-1 ring-inset",
    toneMap: statusToneMap,
  },
  {
    key: "created_at",
    header: "Created",
    valueClassName: "text-sm text-slate-600",
  },
];

export default async function DashboardPage() {
  const users = await getUsers();
  const stats = getDashboardStats(users);
  const tableUsers: UserTableRow[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar ?? "",
    role: getPrimaryUserRole(user),
    status: user.status,
    created_at: formatDate(user.created_at),
  }));

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[32px] font-light text-slate-900">Dashboard</h1>
        </div>
        <div className="text-sm text-muted">Home &gt; Dashboard</div>
      </section>

      <section className="rounded-sm bg-amber-500 px-4 py-3 text-white shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base font-semibold">
            Looking for an admin dashboard template based on Bootstrap styles? This layout now follows that direction.
          </p>
          <span className="inline-flex w-fit rounded-sm bg-white px-3 py-1.5 text-sm font-semibold text-amber-600">
            Admin view
          </span>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Widget
          description="Registered users"
          icon={<BagIcon />}
          title="Total Users"
          tone="primary"
          value={stats.totalUsers}
        />
        <Widget
          description="Can access the dashboard"
          icon={<BarIcon />}
          title="Active Users"
          tone="success"
          value={stats.activeUsers}
        />
        <Widget
          description="Need reactivation"
          icon={<UserPlusIcon />}
          title="Inactive Users"
          tone="warning"
          value={stats.inactiveUsers}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-semibold text-slate-900">Latest Users</h2>
            <div className="flex gap-2 text-xs text-muted">
              <span className="rounded-sm bg-slate-100 px-2 py-1">Table</span>
              <span className="rounded-sm bg-slate-100 px-2 py-1">Hover</span>
            </div>
          </div>
          <Table columns={userColumns} data={tableUsers} showControls={false} />
        </div>
        <Chart
          description="Only active users are allowed to log in."
          items={[
            {
              label: "Active users",
              tone: "emerald",
              value: stats.activeUsers,
            },
            {
              label: "Inactive users",
              tone: "amber",
              value: stats.inactiveUsers,
            },
            {
              label: "Banned users",
              tone: "rose",
              value: stats.bannedUsers,
            },
          ]}
          title="Visitors"
        />
      </section>
    </div>
  );
}
