import React from 'react';
import { MovementLogEntry } from '../types';

interface PrintableReportProps {
  data: MovementLogEntry[];
}

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
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>تقرير حركه المخزن</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>الصنف</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>المورد</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>التكلفة</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>التاريخ والوقت</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>بواسطة</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>نوع الحركة</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>الكمية</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>الرصيد</th>
          </tr>
        </thead>
        <tbody>
          {data.map((log) => (
            <tr key={log.id}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{`${log.item_name} (#${log.item_id})`}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{log.provider || 'N/A'}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{log.cost_per_item || 'N/A'}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{new Date(log.timestamp).toLocaleString()}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{log.person_name || 'N/A'}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{getActionTypeInArabic(log.action_type)}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{log.quantity_changed}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{log.resulting_quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}); 