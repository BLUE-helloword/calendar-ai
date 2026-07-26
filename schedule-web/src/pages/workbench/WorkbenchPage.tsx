import React from 'react';
import ChatPanel from './ChatPanel';
import CalendarPanel from './CalendarPanel';

const WorkbenchPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Left: Chat Panel (40%) */}
      <div style={{
        width: '40%',
        minWidth: 360,
        borderRight: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <ChatPanel />
      </div>

      {/* Right: Calendar Panel (60%) */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <CalendarPanel />
      </div>
    </div>
  );
};

export default WorkbenchPage;
