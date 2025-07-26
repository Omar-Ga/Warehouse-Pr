import React from 'react';
import { MovementLogEntry } from '../types';

interface PrintableReportProps {
  data: MovementLogEntry[];
}

// Helper to safely format a date string
const formatSafeDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleString('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch (error) {
    console.error("Invalid date format for printing:", dateString);
    return 'تاريخ غير صالح';
  }
};

export const PrintableReport = React.forwardRef<HTMLDivElement, PrintableReportProps>((props, ref) => {
  const { data } = props;

  const getActionTypeInArabic = (actionType: string) => {
    switch (actionType) {
      case 'Addition':
        return 'دخول';
      case 'Removal':
        return 'خروج';
      default:
        return actionType;
    }
  };

  return (
    <div ref={ref} style={{ margin: '20px', direction: 'rtl', textAlign: 'right' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px', fontFamily: 'Arial, sans-serif', fontSize: '22pt', fontWeight: 'bold' }}>تقرير حركة المخزن</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt', fontFamily: 'Arial, sans-serif' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={{ border: '1px solid #ddd', padding: '12px' }}>الصنف</th>
            <th style={{ border: '1px solid #ddd', padding: '12px' }}>الوجهة</th>
            <th style={{ border: '1px solid #ddd', padding: '12px' }}>التاريخ والوقت</th>
            <th style={{ border: '1px solid #ddd', padding: '12px' }}>بواسطة</th>
            <th style={{ border: '1px solid #ddd', padding: '12px' }}>نوع الحركة</th>
            <th style={{ border: '1px solid #ddd', padding: '12px' }}>الكمية</th>
            <th style={{ border: '1px solid #ddd', padding: '12px' }}>الرصيد</th>
          </tr>
        </thead>
        <tbody>
          {data.map((log) => (
            <tr key={log.id}>
              <td style={{ border: '1px solid #ddd', padding: '12px' }}>{log.item_name ? `${log.item_name} (#${log.item_id})` : 'N/A'}</td>
              <td style={{ border: '1px solid #ddd', padding: '12px' }}>{log.destination_name || '-'}</td>
              <td style={{ border: '1px solid #ddd', padding: '12px' }}>{formatSafeDate(log.timestamp)}</td>
              <td style={{ border: '1px solid #ddd', padding: '12px' }}>{log.person_name || '-'}</td>
              <td style={{ border: '1px solid #ddd', padding: '12px' }}>{getActionTypeInArabic(log.action_type)}</td>
              <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                {log.quantity_changed !== null && log.quantity_changed !== undefined ? log.quantity_changed : '-'}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                {log.resulting_quantity !== null && log.resulting_quantity !== undefined ? log.resulting_quantity : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}); 