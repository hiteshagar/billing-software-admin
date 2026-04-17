import React, { useState, useEffect, useCallback } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Button,
  Select,
  DatePicker,
  Table,
  Typography,
  Space,
  Spin,
  Empty,
} from 'antd';
import {
  FileTextOutlined,
  DollarOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import dayjs from 'dayjs';
import api from '../api/axios';

const { RangePicker } = DatePicker;
const { Title } = Typography;

const formatCurrency = (val) =>
  `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [skuOptions, setSkuOptions] = useState([]);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [filters, setFilters] = useState({
    dateRange: [dayjs().subtract(30, 'day'), dayjs()],
    skuId: undefined,
    customerId: undefined,
  });
  const [data, setData] = useState(null);

  // Fetch filter options
  useEffect(() => {
    api.get('/admin/skus').then(({ data }) => {
      setSkuOptions(
        (Array.isArray(data) ? data : (data.skus || [])).map((s) => ({ value: s.id, label: `${s.code} - ${s.item_name}` }))
      );
    }).catch(() => {});

    api.get('/admin/customers').then(({ data }) => {
      setCustomerOptions(
        (data.customers || data || []).map((c) => ({ value: c.id, label: c.name }))
      );
    }).catch(() => {});
  }, []);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.dateRange?.[0]) params.start_date = filters.dateRange[0].format('YYYY-MM-DD');
      if (filters.dateRange?.[1]) params.end_date = filters.dateRange[1].format('YYYY-MM-DD');
      if (filters.skuId) params.sku_id = filters.skuId;
      if (filters.customerId) params.customer_id = filters.customerId;

      const { data: res } = await api.get('/admin/dashboard/orders', { params });
      setData(res);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const byItem = data?.byItem || [];
  const byDay = data?.daily || [];
  const topCustomers = data?.byCustomer || [];

  // Compute summary from returned data
  const summary = {
    total_invoices: topCustomers.reduce((s, r) => s + Number(r.invoice_count || 0), 0),
    total_amount: topCustomers.reduce((s, r) => s + Number(r.total_amount || 0), 0),
  };

  const totalItems = byItem.reduce((sum, r) => sum + Number(r.invoice_count || 0), 0);

  // Customer table columns
  const customerCols = [
    { title: 'Customer Name', dataIndex: 'customer_name', key: 'customer_name' },
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (v) => formatCurrency(v),
      align: 'right',
    },
    { title: 'Invoice Count', dataIndex: 'invoice_count', key: 'invoice_count', align: 'center' },
  ];

  // Item breakdown table columns
  const itemCols = [
    { title: 'SKU Code', dataIndex: 'code', key: 'code' },
    { title: 'Item Name', dataIndex: 'item_name', key: 'item_name' },
    { title: 'Total Quantity', dataIndex: 'total_quantity', key: 'total_quantity', align: 'right' },
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (v) => formatCurrency(v),
      align: 'right',
    },
    { title: 'Invoice Count', dataIndex: 'invoice_count', key: 'invoice_count', align: 'center' },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>Dashboard</Title>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <RangePicker
            value={filters.dateRange}
            onChange={(range) => setFilters((f) => ({ ...f, dateRange: range }))}
            format="DD/MM/YYYY"
            allowClear={false}
          />
          <Select
            placeholder="All SKUs"
            options={skuOptions}
            value={filters.skuId}
            onChange={(v) => setFilters((f) => ({ ...f, skuId: v }))}
            allowClear
            style={{ minWidth: 200 }}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
          <Select
            placeholder="All Customers"
            options={customerOptions}
            value={filters.customerId}
            onChange={(v) => setFilters((f) => ({ ...f, customerId: v }))}
            allowClear
            style={{ minWidth: 180 }}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
          <Button type="primary" onClick={fetchDashboard} loading={loading}>
            Apply Filters
          </Button>
        </Space>
      </Card>

      <Spin spinning={loading}>
        {/* Summary Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <Card className="stat-card">
              <Statistic
                title="Total Invoices"
                value={summary.total_invoices || 0}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="stat-card">
              <Statistic
                title="Total Amount"
                value={Number(summary.total_amount || 0).toFixed(2)}
                prefix="₹"
                precision={2}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="stat-card">
              <Statistic
                title="Total Items"
                value={totalItems}
                prefix={<ShoppingOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Charts */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} lg={12}>
            <Card title="Orders by Item">
              {byItem.length === 0 ? (
                <Empty description="No data" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={byItem} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="sku_code"
                      angle={-35}
                      textAnchor="end"
                      interval={0}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip formatter={(v, name) => name === 'total_amount' ? formatCurrency(v) : v} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="total_quantity" name="Quantity" fill="#1677ff" />
                    <Bar yAxisId="right" dataKey="total_amount" name="Amount (₹)" fill="#52c41a" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Daily Orders">
              {byDay.length === 0 ? (
                <Empty description="No data" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={byDay} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      angle={-35}
                      textAnchor="end"
                      interval="preserveStartEnd"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(d) => dayjs(d).format('DD/MM')}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(d) => dayjs(d).format('DD/MM/YYYY')}
                      formatter={(v) => [formatCurrency(v), 'Total Amount']}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="total_amount"
                      name="Amount (₹)"
                      stroke="#1677ff"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>
          </Col>
        </Row>

        {/* Tables */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={10}>
            <Card title="Top Customers">
              <Table
                dataSource={topCustomers}
                columns={customerCols}
                rowKey={(r, i) => r.customer_id || i}
                pagination={false}
                size="small"
                locale={{ emptyText: <Empty description="No data" /> }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={14}>
            <Card title="Item Breakdown">
              <Table
                dataSource={byItem}
                columns={itemCols}
                rowKey={(r, i) => r.sku_id || i}
                pagination={false}
                size="small"
                scroll={{ x: 600 }}
                locale={{ emptyText: <Empty description="No data" /> }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
}
