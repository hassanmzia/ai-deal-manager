"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  DollarSign,
  FileText,
  Target,
  CheckCircle,
  Clock,
} from "lucide-react";

const kpiCards = [
  {
    title: "Active Deals",
    value: "24",
    change: "+3 this week",
    icon: Target,
    color: "text-blue-600",
  },
  {
    title: "Pipeline Value",
    value: "$4.2M",
    change: "+12% from last month",
    icon: DollarSign,
    color: "text-green-600",
  },
  {
    title: "Open Proposals",
    value: "8",
    change: "3 due this week",
    icon: FileText,
    color: "text-orange-600",
  },
  {
    title: "Win Rate",
    value: "68%",
    change: "+5% improvement",
    icon: TrendingUp,
    color: "text-emerald-600",
  },
  {
    title: "Contracts Signed",
    value: "12",
    change: "This quarter",
    icon: CheckCircle,
    color: "text-purple-600",
  },
  {
    title: "Avg. Close Time",
    value: "32 days",
    change: "-4 days improvement",
    icon: Clock,
    color: "text-cyan-600",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your deal management pipeline
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">{kpi.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Activity feed will be displayed here with real-time updates from
              the deal pipeline.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Upcoming proposal deadlines and contract milestones will be listed
              here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
