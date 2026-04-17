import React, { useState, useEffect, useRef } from 'react';
import {
  Table,
  Button,
  Select,
  DatePicker,
  Typography,
  Space,
  Row,
  Col,
  Tag,
  Empty,
  Card,
} from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const formatCurrency = (val) =>
  `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [filters, setFilters] = useState({
    dateRange: null,
    customerId: undefined,
  });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const fetchInvoices = async (page = 1, overrideFilters) => {
    setLoading(true);
    const activeFilters = overrideFilters || filtersRef.current;
    try {
      const params = { page, limit: 20 };
      if (activeFilters.dateRange?.[0]) params.start_date = activeFilters.dateRange[0].format('YYYY-MM-DD');
      if (activeFilters.dateRange?.[1]) params.end_date = activeFilters.dateRange[1].format('YYYY-MM-DD');
      if (activeFilters.customerId) params.customer_id = activeFilters.customerId;

      const { data } = await api.get('/admin/invoices', { params });
      const rows = Array.isArray(data) ? data : (data.invoices || []);
      setInvoices(rows);
      setPagination((p) => ({ ...p, current: page, total: data.total || rows.length }));
    } catch (err) {
      console.error('Failed to load invoices', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/admin/customers').then(({ data }) => {
      setCustomerOptions(
        (Array.isArray(data) ? data : (data.customers || [])).map((c) => ({ value: c.id, label: c.name }))
      );
    }).catch(() => {});
    fetchInvoices(1);
  }, []);

  const handleFilter = () => fetchInvoices(1, filters);

  const handleTableChange = (pag) => fetchInvoices(pag.current);

  const columns = [
    {
      title: 'Invoice Number',
      dataIndex: 'invoice_number',
      key: 'invoice_number',
      render: (v) => <strong>{v}</strong>,
    },
    {
      title: 'Customer',
      key: 'customer_name',
      render: (_, record) => record.customer?.name || '-',
    },
    {
      title: 'Date',
      dataIndex: 'invoice_date',
      key: 'invoice_date',
      render: (v) => (v ? dayjs(v).format('DD/MM/YYYY') : '-'),
    },
    {
      title: 'Transport Provider',
      key: 'transport_provider_name',
      render: (_, record) => record.transport_provider?.name || <span style={{ color: '#bfbfbf' }}>N/A</span>,
    },
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (v) => formatCurrency(v),
      align: 'right',
    },
    {
      title: 'Items',
      dataIndex: 'items_count',
      key: 'items_count',
      align: 'center',
      render: (v) => <Tag color="blue">{v || 0}</Tag>,
    },
    {
      title: 'Created By',
      key: 'created_by',
      render: (_, record) => record.created_by?.name || '-',
    },
    {
      title: 'Supported By',
      key: 'supported_by',
      render: (_, record) => record.supported_by?.name || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/invoices/${record.id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>Invoices</Title>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <RangePicker
            value={filters.dateRange}
            onChange={(range) => setFilters((f) => ({ ...f, dateRange: range }))}
            format="DD/MM/YYYY"
            placeholder={['From Date', 'To Date']}
          />
          <Select
            placeholder="All Customers"
            options={customerOptions}
            value={filters.customerId}
            onChange={(v) => setFilters((f) => ({ ...f, customerId: v }))}
            allowClear
            style={{ minWidth: 200 }}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
          <Button type="primary" onClick={handleFilter} loading={loading}>
            Apply Filters
          </Button>
          <Button
            onClick={() => {
              setFilters({ dateRange: null, customerId: undefined });
              setTimeout(() => fetchInvoices(1), 100);
            }}
          >
            Reset
          </Button>
        </Space>
      </Card>

      <Table
        dataSource={invoices}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: false,
          showTotal: (total) => `Total ${total} invoices`,
        }}
        onChange={handleTableChange}
        onRow={(record) => ({
          onClick: () => navigate(`/invoices/${record.id}`),
          style: { cursor: 'pointer' },
        })}
        locale={{ emptyText: <Empty description="No invoices found" /> }}
      />
    </div>
  );
}
