import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  People,
  Assignment,
  AccountBalanceWallet,
  Eco,
  Star,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { adminAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';

const StatCard = ({ title, value, icon, color, trend, trendValue }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="h6">
            {title}
          </Typography>
          <Typography variant="h4" component="h2">
            {value}
          </Typography>
          {trend && (
            <Box display="flex" alignItems="center" mt={1}>
              <TrendingUp
                fontSize="small"
                color={trend > 0 ? 'success' : 'error'}
              />
              <Typography
                variant="body2"
                color={trend > 0 ? 'success.main' : 'error.main'}
                ml={0.5}
              >
                {trend > 0 ? '+' : ''}{trendValue}%
              </Typography>
            </Box>
          )}
        </Box>
        <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const RecentBookingsTable = ({ bookings }) => (
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Booking ID</TableCell>
          <TableCell>Customer</TableCell>
          <TableCell>Collector</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Amount</TableCell>
          <TableCell>Date</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {bookings?.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell>#{booking.id.slice(-8)}</TableCell>
            <TableCell>{booking.customer_name}</TableCell>
            <TableCell>{booking.collector_name || 'Unassigned'}</TableCell>
            <TableCell>
              <Chip
                label={booking.status}
                color={
                  booking.status === 'completed'
                    ? 'success'
                    : booking.status === 'in_progress'
                    ? 'warning'
                    : 'default'
                }
                size="small"
              />
            </TableCell>
            <TableCell>{formatCurrency(booking.actual_value || booking.estimated_value)}</TableCell>
            <TableCell>{formatDate(booking.created_at)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

const TopCollectorsTable = ({ collectors }) => (
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Collector</TableCell>
          <TableCell>Pickups</TableCell>
          <TableCell>Earnings</TableCell>
          <TableCell>Rating</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {collectors?.map((collector, index) => (
          <TableRow key={collector.collector_id}>
            <TableCell>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                  {collector.name?.charAt(0)}
                </Avatar>
                {collector.name}
              </Box>
            </TableCell>
            <TableCell>{collector.total_pickups}</TableCell>
            <TableCell>{formatCurrency(collector.total_earnings)}</TableCell>
            <TableCell>
              <Box display="flex" alignItems="center">
                <Star fontSize="small" color="warning" />
                <Typography variant="body2" ml={0.5}>
                  {collector.average_rating || 'N/A'}
                </Typography>
              </Box>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

export default function Dashboard() {
  const { data: dashboardData, isLoading } = useQuery(
    'dashboard',
    () => adminAPI.getDashboard(),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  if (isLoading) {
    return <LinearProgress />;
  }

  const stats = dashboardData?.data?.stats || {};
  const recentBookings = dashboardData?.data?.recentBookings || [];
  const topCollectors = dashboardData?.data?.topCollectors || [];

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Customers"
            value={stats.total_customers || 0}
            icon={<People />}
            color="primary.main"
            trend={12}
            trendValue={5.2}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Collectors"
            value={stats.total_collectors || 0}
            icon={<Eco />}
            color="secondary.main"
            trend={8}
            trendValue={3.1}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Bookings"
            value={stats.total_bookings || 0}
            icon={<Assignment />}
            color="info.main"
            trend={15}
            trendValue={7.8}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.total_payments || 0)}
            icon={<AccountBalanceWallet />}
            color="success.main"
            trend={20}
            trendValue={12.5}
          />
        </Grid>
      </Grid>

      {/* Charts and Tables */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Bookings
              </Typography>
              <RecentBookingsTable bookings={recentBookings} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Collectors
              </Typography>
              <TopCollectorsTable collectors={topCollectors} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Stats */}
      <Grid container spacing={3} mt={1}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Booking Status Distribution
              </Typography>
              <Box mt={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Completed</Typography>
                  <Typography variant="body2">
                    {stats.completed_bookings || 0}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={
                    stats.total_bookings
                      ? ((stats.completed_bookings || 0) / stats.total_bookings) * 100
                      : 0
                  }
                  sx={{ mb: 2 }}
                />
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Pending</Typography>
                  <Typography variant="body2">
                    {stats.pending_bookings || 0}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={
                    stats.total_bookings
                      ? ((stats.pending_bookings || 0) / stats.total_bookings) * 100
                      : 0
                  }
                  color="warning"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Material Collection Stats
              </Typography>
              <Box mt={2}>
                <Typography variant="body2" color="textSecondary">
                  Total Weight Collected
                </Typography>
                <Typography variant="h5" color="primary">
                  {stats.total_weight_collected || 0} kg
                </Typography>
                <Typography variant="body2" color="textSecondary" mt={1}>
                  Average per pickup: {stats.total_bookings ? 
                    Math.round((stats.total_weight_collected || 0) / stats.total_bookings * 10) / 10 : 0} kg
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
