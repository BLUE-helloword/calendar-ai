import React, { useMemo } from 'react';
import { Card, Spin, Empty } from 'antd';
import dayjs from 'dayjs';
import { useWeekCalendar } from '../../hooks/useWeekCalendar';
import WeekHeader from '../../components/calendar/WeekHeader';
import TimeGrid from '../../components/calendar/TimeGrid';

const WeekCalendarPage: React.FC = () => {
  const { data, loading, currentDate, goToWeek, refresh } = useWeekCalendar(
    dayjs().format('YYYY-MM-DD')
  );

  const handlePrev = () => {
    if (data) {
      goToWeek(dayjs(data.weekStart).subtract(7, 'day').format('YYYY-MM-DD'));
    }
  };

  const handleNext = () => {
    if (data) {
      goToWeek(dayjs(data.weekStart).add(7, 'day').format('YYYY-MM-DD'));
    }
  };

  const handleToday = () => {
    goToWeek(dayjs().format('YYYY-MM-DD'));
  };

  const totalItems = useMemo(() => {
    if (!data) return 0;
    return data.days.reduce((sum, d) => sum + d.items.length, 0);
  }, [data]);

  return (
    <div>
      <Spin spinning={loading}>
        {data ? (
          <Card
            title={
              <WeekHeader
                weekStart={data.weekStart}
                weekEnd={data.weekEnd}
                onPrev={handlePrev}
                onNext={handleNext}
                onToday={handleToday}
              />
            }
            styles={{ body: { padding: 0 } }}
          >
            <div>
              {data.days.every((d) => d.items.length === 0) ? (
                <Empty description="本周暂无日程" style={{ padding: 60 }} />
              ) : (
                <TimeGrid days={data.days} />
              )}
            </div>
          </Card>
        ) : (
          !loading && <Empty description="无法加载周历" style={{ padding: 60 }} />
        )}
      </Spin>
      {data && (
        <div style={{ marginTop: 8, textAlign: 'center', color: '#999', fontSize: 12 }}>
          共 {totalItems} 项日程
        </div>
      )}
    </div>
  );
};

export default WeekCalendarPage;
